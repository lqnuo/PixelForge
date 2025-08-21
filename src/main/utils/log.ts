import { app } from 'electron'
import { existsSync, mkdirSync, statSync, renameSync, appendFileSync } from 'fs'
import { join } from 'path'

type Level = 'info' | 'warn' | 'error'

const MAX_BYTES = 5 * 1024 * 1024 // 5MB
const MAX_FILES = 3

function logFilePath() {
  const dir = join(app.getPath('userData'), 'logs')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return join(dir, 'app.log')
}

function rotateIfNeeded(file: string) {
  try {
    const st = statSync(file)
    if (st.size < MAX_BYTES) return
  } catch {
    return
  }
  // rotate app.log -> app.log.1, app.log.1 -> .2, ...
  for (let i = MAX_FILES - 1; i >= 1; i--) {
    const src = `${file}.${i}`
    const dst = `${file}.${i + 1}`
    try { renameSync(src, dst) } catch {}
  }
  try { renameSync(file, `${file}.1`) } catch {}
}

function write(level: Level, msg: string, meta?: any) {
  const timestamp = new Date().toISOString()
  const metaStr = meta ? ' ' + safeJson(meta) : ''
  const line = `${timestamp} [${level.toUpperCase()}] ${msg}${metaStr}\n`
  
  // Write to file
  const file = logFilePath()
  rotateIfNeeded(file)
  appendFileSync(file, line, { encoding: 'utf8' })
  
  // Also output to console
  const consoleMsg = `[${level.toUpperCase()}] ${msg}`
  if (level === 'error') {
    console.error(consoleMsg, meta || '')
  } else if (level === 'warn') {
    console.warn(consoleMsg, meta || '')
  } else {
    console.log(consoleMsg, meta || '')
  }
}

function safeJson(x: unknown) {
  try { return JSON.stringify(x) } catch { return '' }
}

export const logger = {
  info: (m: string, meta?: any) => write('info', m, meta),
  warn: (m: string, meta?: any) => write('warn', m, meta),
  error: (m: string, meta?: any) => write('error', m, meta),
}

