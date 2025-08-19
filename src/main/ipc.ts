import { ipcMain, dialog } from 'electron'
import { randomUUID } from 'crypto'
import { getDb } from './db'
import { images, jobs, results, styles } from './db/schema'
import { sha256 } from './utils/crypto'
import { eq, desc } from 'drizzle-orm'
import { writeFileSync } from 'fs'
import { enqueueJob } from './jobs/worker'

type UploadItem = {
  filename: string
  mimeType: string
  sizeBytes: number
  width?: number
  height?: number
  // base64 without data: prefix
  dataBase64: string
  previewBase64?: string | null
}

export function registerIpcHandlers() {
  const db = getDb()

  ipcMain.handle('image.upload', async (_evt, payload: { items: UploadItem[] }) => {
    const items = payload?.items ?? []
    const inserted: any[] = []
    for (const it of items) {
      const buf = Buffer.from(it.dataBase64, 'base64')
      const hash = sha256(buf)
      // check duplicate
      const existing = db.select().from(images).where(eq(images.sha256, hash)).all()
      if (existing.length > 0) {
        inserted.push(existing[0])
        continue
      }
      const id = randomUUID()
      const row = {
        id,
        filename: it.filename,
        mimeType: it.mimeType,
        sizeBytes: it.sizeBytes,
        width: it.width ?? null,
        height: it.height ?? null,
        sha256: hash,
        dataBlob: buf,
        previewBase64: it.previewBase64 ?? null,
      }
      db.insert(images).values(row).run()
      inserted.push(row)
    }
    // lightweight return (without BLOB)
    return inserted.map((r) => ({
      id: r.id,
      filename: r.filename,
      mimeType: r.mimeType,
      sizeBytes: r.sizeBytes,
      width: r.width,
      height: r.height,
      sha256: r.sha256,
      previewBase64: r.previewBase64,
      createdAt: r.createdAt,
    }))
  })

  ipcMain.handle('image.list', async (_evt) => {
    const rows = db.select({
      id: images.id,
      filename: images.filename,
      mimeType: images.mimeType,
      sizeBytes: images.sizeBytes,
      width: images.width,
      height: images.height,
      sha256: images.sha256,
      previewBase64: images.previewBase64,
      createdAt: images.createdAt,
    }).from(images).orderBy(desc(images.createdAt)).all()
    return rows
  })

  ipcMain.handle('job.create', async (_evt, payload: { imageId: string; styleId?: string | null; aspectRatio: string }) => {
    const id = randomUUID()
    const row = {
      id,
      sourceImageId: payload.imageId,
      styleId: payload.styleId ?? null,
      aspectRatio: payload.aspectRatio,
      status: 'queued',
      error: null as string | null,
    }
    db.insert(jobs).values(row).run()
    enqueueJob(id)
    return row
  })

  ipcMain.handle('result.listByImage', async (_evt, payload: { imageId: string }) => {
    const rows = db.select({
      id: results.id,
      jobId: results.jobId,
      sourceImageId: results.sourceImageId,
      mimeType: results.mimeType,
      width: results.width,
      height: results.height,
      previewBase64: results.previewBase64,
      createdAt: results.createdAt,
    }).from(results).where(eq(results.sourceImageId, payload.imageId)).all()
    return rows
  })

  ipcMain.handle('result.listByJob', async (_evt, payload: { jobId: string }) => {
    const rows = db.select({
      id: results.id,
      jobId: results.jobId,
      sourceImageId: results.sourceImageId,
      mimeType: results.mimeType,
      width: results.width,
      height: results.height,
      previewBase64: results.previewBase64,
      createdAt: results.createdAt,
    }).from(results).where(eq(results.jobId, payload.jobId)).all()
    return rows
  })

  ipcMain.handle('job.listByImage', async (_evt, payload: { imageId: string }) => {
    const rows = db.select().from(jobs).where(eq(jobs.sourceImageId, payload.imageId)).all()
    return rows
  })

  ipcMain.handle('style.list', async () => {
    const rows = db.select().from(styles).all()
    return rows
  })

  ipcMain.handle('file.download', async (_evt, payload: { resultId: string; suggestedName?: string }) => {
    // pick save path via dialog (scaffold)
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: payload.suggestedName ?? 'output.png',
    })
    if (canceled || !filePath) return { canceled: true }
    // read blob from DB
    const row = db
      .select({ id: results.id, dataBlob: results.dataBlob })
      .from(results)
      .where(eq(results.id, payload.resultId))
      .get()
    if (!row) return { error: 'NOT_FOUND' }
    const buf: Buffer = row.dataBlob as unknown as Buffer
    writeFileSync(filePath, buf)
    return { ok: true, filePath }
  })
}
