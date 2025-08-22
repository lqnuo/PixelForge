import { app } from 'electron'
import { join, dirname, isAbsolute } from 'path'
import { existsSync, mkdirSync } from 'fs'

/**
 * Get database file path, handling both dev and production environments
 */
export function getDatabasePath(): string {
  // Explicit override via env for advanced scenarios (e.g., testing)
  const override = process.env.QWAN_DB_PATH
  if (override && typeof override === 'string') {
    const abs = isAbsolute(override) ? override : join(process.cwd(), override)
    const dir = dirname(abs)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    return abs
  }

  // In development, use a local directory for easier debugging
  if (process.env.NODE_ENV === 'development') {
    const devDbPath = join(process.cwd(), '.local-dev')
    if (!existsSync(devDbPath)) {
      mkdirSync(devDbPath, { recursive: true })
    }
    return join(devDbPath, 'app.db')
  }
  
  // In production, use Electron's userData directory
  const userData = app.getPath('userData')
  if (!existsSync(userData)) {
    mkdirSync(userData, { recursive: true })
  }
  return join(userData, 'app.db')
}
