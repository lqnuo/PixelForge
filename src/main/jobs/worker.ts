import { getDb } from '../db'
import { jobs, images, results } from '../db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { BrowserWindow } from 'electron'
import { logger } from '../utils/log'
import { withRetry } from '../utils/retry'

let running = false
let queue: string[] = []
const CONCURRENCY = 1
let active = 0

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
  queue.push(jobId)
  logger.info('Job enqueued', { jobId })
  tick()
}

export function startWorker() {
  running = true
  tick()
}

function tick() {
  if (!running) return
  if (active >= CONCURRENCY) return
  const next = queue.shift()
  if (!next) return
  active++
  logger.info('Job started', { jobId: next })
  processJob(next)
    .catch(() => {})
    .finally(() => {
      active--
      logger.info('Job finished', { jobId: next })
      setImmediate(tick)
    })
}

async function processJob(jobId: string) {
  const db = getDb()
  // mark processing
  await withRetry(() => db.update(jobs).set({ status: 'processing' }).where(eq(jobs.id, jobId)).run())
  broadcast('job.updated', { jobId, status: 'processing' })
  // load job and image
  const job = db.select().from(jobs).where(eq(jobs.id, jobId)).get()
  if (!job) return
  const img = db.select().from(images).where(eq(images.id, job.sourceImageId)).get()
  if (!img) {
    await withRetry(() => db.update(jobs).set({ status: 'failed', error: 'SOURCE_IMAGE_NOT_FOUND' }).where(eq(jobs.id, jobId)).run())
    logger.warn('Job failed: source image missing', { jobId })
    broadcast('job.updated', { jobId, status: 'failed', error: 'SOURCE_IMAGE_NOT_FOUND' })
    return
  }
  // Mock generation: copy the source buffer as result
  const rid = randomUUID()
  await withRetry(() => db.insert(results).values({
    id: rid,
    jobId: jobId,
    sourceImageId: job.sourceImageId,
    mimeType: img.mimeType,
    width: img.width ?? null,
    height: img.height ?? null,
    dataBlob: img.dataBlob as unknown as Buffer,
    previewBase64: img.previewBase64 ?? null,
  }).run())
  broadcast('result.created', { id: rid, jobId, sourceImageId: job.sourceImageId })
  await withRetry(() => db.update(jobs).set({ status: 'done', error: null }).where(eq(jobs.id, jobId)).run())
  broadcast('job.updated', { jobId, status: 'done' })
}
