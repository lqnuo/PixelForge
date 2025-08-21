import { getDb } from '../db'
import { jobs, images, results } from '../db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { BrowserWindow } from 'electron'
import { logger } from '../utils/log'
import { withRetry } from '../utils/retry'
import { outpaintWithQwen } from './provider-qwen'
import PQueue from 'p-queue'

const queue = new PQueue({ concurrency: 2 })

function broadcast(channel: string, payload: any) {
  for (const win of BrowserWindow.getAllWindows()) {
    try {
      win.webContents.send(channel, payload)
    } catch {
      // ignore
    }
  }
}

export function enqueueJob(jobId: string) {
  queue.add(() => processJob(jobId), {
    priority: 0
  })
  logger.info('Job enqueued', { jobId, queueSize: queue.size })
}

export function startWorker() {
  queue.start()
  logger.info('Worker started', { concurrency: queue.concurrency })
}

async function processJob(jobId: string) {
  const db = getDb()
  logger.info('Job started', { jobId })
  
  try {
    // mark processing
    await withRetry(() => db.update(jobs).set({ status: 'processing' }).where(eq(jobs.id, jobId)).run())
    broadcast('job.updated', { jobId, status: 'processing' })

    // load job and image
    const job = db.select().from(jobs).where(eq(jobs.id, jobId)).get()
    if (!job) {
      logger.warn('Job not found', { jobId })
      return
    }
    
    const img = db.select().from(images).where(eq(images.id, job.sourceImageId)).get()
    if (!img) {
      await withRetry(() => db.update(jobs).set({ status: 'failed', error: 'SOURCE_IMAGE_NOT_FOUND' }).where(eq(jobs.id, jobId)).run())
      logger.warn('Job failed: source image missing', { jobId })
      broadcast('job.updated', { jobId, status: 'failed', error: 'SOURCE_IMAGE_NOT_FOUND' })
      return
    }

    // Perform outpainting via Qwen Image Edit
    const { data, mime, width, height } = await outpaintWithQwen(
      (img.dataBlob as unknown as Buffer) || Buffer.alloc(0),
      (job.aspectRatio as '1:1' | '3:4')
    )
    
    const rid = randomUUID()
    // Convert image data to base64 for preview
    const previewBase64 = data.toString('base64')
    
    await withRetry(() =>
      db
        .insert(results)
        .values({
          id: rid,
          jobId: jobId,
          sourceImageId: job.sourceImageId,
          mimeType: mime || img.mimeType,
          width: width ?? null,
          height: height ?? null,
          dataBlob: data,
          previewBase64: previewBase64,
        })
        .run()
    )
    
    broadcast('result.created', { id: rid, jobId, sourceImageId: job.sourceImageId })
    await withRetry(() => db.update(jobs).set({ status: 'done', error: null }).where(eq(jobs.id, jobId)).run())
    broadcast('job.updated', { jobId, status: 'done' })
    
  } catch (e: any) {
    const msg = String(e?.message || 'UNKNOWN')
    await withRetry(() => db.update(jobs).set({ status: 'failed', error: msg }).where(eq(jobs.id, jobId)).run())
    logger.error('Job failed', { jobId, error: msg })
    broadcast('job.updated', { jobId, status: 'failed', error: msg })
  } finally {
    logger.info('Job finished', { jobId })
  }
}
