import { app } from 'electron'
import Database from 'better-sqlite3'
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

let dbInstance: BetterSQLite3Database | null = null

export function initDb(): BetterSQLite3Database {
  if (dbInstance) return dbInstance
  const userData = app.getPath('userData')
  if (!existsSync(userData)) {
    mkdirSync(userData, { recursive: true })
  }
  const dbFile = join(userData, 'app.db')
  const sqlite = new Database(dbFile)
  dbInstance = drizzle(sqlite)
  return dbInstance
}

export function getDb(): BetterSQLite3Database {
  if (!dbInstance) {
    return initDb()
  }
  return dbInstance
}

