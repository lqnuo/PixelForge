import { ipcMain, dialog, IpcMainInvokeEvent, shell, app } from 'electron'
import { randomUUID } from 'crypto'
import { getDb } from './db'
import { images, jobs, results, styles } from './db/schema'
import { sha256 } from './utils/crypto'
import { eq, desc } from 'drizzle-orm'
import { writeFileSync } from 'fs'
import { enqueueJob } from './jobs/worker'
import { logger } from './utils/log'
import { withRetry } from './utils/retry'
import { isArray, isString, validateUploadItem } from './utils/validate'

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

  function isTrustedSender(evt: IpcMainInvokeEvent): boolean {
    try {
      const url = evt?.senderFrame?.url || ''
      if (!url) return false
      if (url.startsWith('file://')) return true
      // allow localhost dev server
      if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) return true
      return false
    } catch {
      return false
    }
  }

  ipcMain.handle('image.upload', async (evt, payload: { items: UploadItem[] }) => {
    if (!isTrustedSender(evt)) return { ok: false, code: 'E_FORBIDDEN', message: 'untrusted sender' }
    const items = payload?.items ?? []
    if (!isArray(items)) {
      logger.warn('image.upload validation failed: items not array')
      return { ok: false, code: 'E_VALIDATION', message: 'items must be array' }
    }
    const inserted: any[] = []
    for (const it of items) {
      if (!validateUploadItem(it)) continue
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
      await withRetry(() => db.insert(images).values(row).run())
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

  ipcMain.handle('image.delete', async (evt, payload: { imageId: string }) => {
    if (!isTrustedSender(evt)) return { ok: false, code: 'E_FORBIDDEN', message: 'untrusted sender' }
    if (!payload?.imageId) return { ok: false, code: 'E_VALIDATION', message: 'imageId required' }
    const exist = db.select({ id: images.id }).from(images).where(eq(images.id, payload.imageId)).get()
    if (!exist) return { ok: false, code: 'E_NOT_FOUND', message: 'image not found' }
    try {
      // Remove results by image then jobs by image then the image
      db.delete(results).where(eq(results.sourceImageId, payload.imageId)).run()
      db.delete(jobs).where(eq(jobs.sourceImageId, payload.imageId)).run()
      db.delete(images).where(eq(images.id, payload.imageId)).run()
      return { ok: true }
    } catch (e) {
      logger.error('image.delete failed', e)
      return { ok: false, code: 'E_IO', message: 'failed to delete' }
    }
  })

  ipcMain.handle('image.list', async (evt) => {
    if (!isTrustedSender(evt)) return { ok: false, code: 'E_FORBIDDEN', message: 'untrusted sender' }
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

  ipcMain.handle('job.create', async (evt, payload: { imageId: string; styleId?: string | null; aspectRatio: string }) => {
    if (!isTrustedSender(evt)) return { ok: false, code: 'E_FORBIDDEN', message: 'untrusted sender' }
    if (!payload?.imageId || typeof payload.imageId !== 'string') {
      return { ok: false, code: 'E_VALIDATION', message: 'imageId required' }
    }
    if (!payload?.aspectRatio || typeof payload.aspectRatio !== 'string') {
      return { ok: false, code: 'E_VALIDATION', message: 'aspectRatio required' }
    }
    if (!['1:1','3:4'].includes(payload.aspectRatio)) {
      return { ok: false, code: 'E_VALIDATION', message: 'aspectRatio invalid' }
    }
    const existImg = db.select({ id: images.id }).from(images).where(eq(images.id, payload.imageId)).get()
    if (!existImg) {
      return { ok: false, code: 'E_NOT_FOUND', message: 'image not found' }
    }
    if (payload.styleId) {
      const existStyle = db.select({ id: styles.id }).from(styles).where(eq(styles.id, payload.styleId)).get()
      if (!existStyle) {
        return { ok: false, code: 'E_NOT_FOUND', message: 'style not found' }
      }
    }
    const id = randomUUID()
    const row = {
      id,
      sourceImageId: payload.imageId,
      styleId: payload.styleId ?? null,
      aspectRatio: payload.aspectRatio,
      status: 'queued',
      error: null as string | null,
    }
    await withRetry(() => db.insert(jobs).values(row).run())
    enqueueJob(id)
    return row
  })

  ipcMain.handle(
    'job.bulkCreate',
    async (
      evt,
      payload: { imageIds: string[]; styleId?: string | null; aspectRatio: string }
    ) => {
      if (!isTrustedSender(evt))
        return { ok: false, code: 'E_FORBIDDEN', message: 'untrusted sender' }
      const imageIds = payload?.imageIds || []
      if (!Array.isArray(imageIds) || imageIds.length === 0)
        return { ok: false, code: 'E_VALIDATION', message: 'imageIds required' }
      if (!payload?.aspectRatio || typeof payload.aspectRatio !== 'string') {
        return { ok: false, code: 'E_VALIDATION', message: 'aspectRatio required' }
      }
      if (!['1:1', '3:4'].includes(payload.aspectRatio)) {
        return { ok: false, code: 'E_VALIDATION', message: 'aspectRatio invalid' }
      }
      if (payload.styleId) {
        const existStyle = db
          .select({ id: styles.id })
          .from(styles)
          .where(eq(styles.id, payload.styleId))
          .get()
        if (!existStyle) return { ok: false, code: 'E_NOT_FOUND', message: 'style not found' }
      }
      const created: string[] = []
      for (const imgId of imageIds) {
        const existImg = db.select({ id: images.id }).from(images).where(eq(images.id, imgId)).get()
        if (!existImg) continue
        const id = randomUUID()
        const row = {
          id,
          sourceImageId: imgId,
          styleId: payload.styleId ?? null,
          aspectRatio: payload.aspectRatio,
          status: 'queued',
          error: null as string | null,
        }
        await withRetry(() => db.insert(jobs).values(row).run())
        enqueueJob(id)
        created.push(id)
      }
      return { ok: true, count: created.length, ids: created }
    }
  )

  ipcMain.handle('job.retry', async (_evt, payload: { jobId: string }) => {
    if (!payload?.jobId) return { ok: false, code: 'E_VALIDATION', message: 'jobId required' }
    const j = db.select().from(jobs).where(eq(jobs.id, payload.jobId)).get()
    if (!j) return { ok: false, code: 'E_NOT_FOUND', message: 'job not found' }
    await withRetry(() => db.update(jobs).set({ status: 'queued', error: null }).where(eq(jobs.id, payload.jobId)).run())
    enqueueJob(payload.jobId)
    return { ok: true }
  })

  ipcMain.handle('result.listByImage', async (evt, payload: { imageId: string }) => {
    if (!isTrustedSender(evt)) return { ok: false, code: 'E_FORBIDDEN', message: 'untrusted sender' }
    if (!isString(payload?.imageId)) return { ok: false, code: 'E_VALIDATION', message: 'imageId required' }
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

  ipcMain.handle('result.listByJob', async (evt, payload: { jobId: string }) => {
    if (!isTrustedSender(evt)) return { ok: false, code: 'E_FORBIDDEN', message: 'untrusted sender' }
    if (!isString(payload?.jobId)) return { ok: false, code: 'E_VALIDATION', message: 'jobId required' }
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

  ipcMain.handle('job.listByImage', async (evt, payload: { imageId: string }) => {
    if (!isTrustedSender(evt)) return { ok: false, code: 'E_FORBIDDEN', message: 'untrusted sender' }
    if (!isString(payload?.imageId)) return { ok: false, code: 'E_VALIDATION', message: 'imageId required' }
    const rows = db.select().from(jobs).where(eq(jobs.sourceImageId, payload.imageId)).all()
    return rows
  })

  ipcMain.handle(
    'job.list',
    async (
      evt,
      payload: { page?: number; pageSize?: number; status?: string | null }
    ) => {
      if (!isTrustedSender(evt))
        return { ok: false, code: 'E_FORBIDDEN', message: 'untrusted sender' }
      const page = Math.max(1, Math.floor(payload?.page ?? 1))
      const pageSize = Math.min(100, Math.max(1, Math.floor(payload?.pageSize ?? 20)))
      // fetch all (small scale) and slice; keeps implementation simple
      const all = db.select().from(jobs).orderBy(desc(jobs.createdAt)).all()
      const filtered = payload?.status ? all.filter((j) => j.status === payload.status) : all
      const total = filtered.length
      const offset = (page - 1) * pageSize
      const items = filtered.slice(offset, offset + pageSize)
      return { items, total, page, pageSize }
    }
  )

  ipcMain.handle('style.list', async (evt) => {
    if (!isTrustedSender(evt)) return { ok: false, code: 'E_FORBIDDEN', message: 'untrusted sender' }
    const rows = db.select().from(styles).all()
    return rows
  })

  ipcMain.handle('file.download', async (evt, payload: { resultId: string; suggestedName?: string }) => {
    if (!isTrustedSender(evt)) return { canceled: true }
    if (!isString(payload?.resultId)) return { error: 'E_VALIDATION' }
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
    await withRetry(() => writeFileSync(filePath, buf))
    return { ok: true, filePath }
  })

  ipcMain.handle('file.openDownloadsDir', async (evt) => {
    if (!isTrustedSender(evt)) return { ok: false }
    try {
      const dir = app.getPath('downloads')
      await shell.openPath(dir)
      return { ok: true }
    } catch (e) {
      logger.error('openDownloadsDir failed', e)
      return { ok: false }
    }
  })

  ipcMain.handle('db.clear', async (evt, payload: { confirmToken: string }) => {
    if (!isTrustedSender(evt)) return { ok: false, code: 'E_FORBIDDEN', message: 'untrusted sender' }
    if (!payload?.confirmToken || payload.confirmToken !== 'CONFIRM_CLEAR') {
      return { ok: false, code: 'E_VALIDATION', message: 'Invalid confirm token' }
    }
    try {
      await withRetry(() => db.delete(results).run())
      await withRetry(() => db.delete(jobs).run())
      await withRetry(() => db.delete(images).run())
      return { ok: true }
    } catch (e) {
      logger.error('db.clear failed', e)
      return { ok: false, code: 'E_IO', message: 'Failed to clear database' }
    }
  })
}
