import Database from 'better-sqlite3'
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { getDatabasePath } from './config'
import * as schema from './schema'
import { join } from 'path'

let dbInstance: BetterSQLite3Database<typeof schema> | null = null

export function initDb(): BetterSQLite3Database<typeof schema> {
  if (dbInstance) return dbInstance
  
  const dbFile = getDatabasePath()
  const sqlite = new Database(dbFile)
  
  // Basic pragmas for stability
  sqlite.pragma('journal_mode = WAL')
  
  const db = drizzle(sqlite, { schema })
  dbInstance = db
  
  // Run DDL migrations. In dev, run from workspace; in prod, run from resources.
  try {
    const migrationsFolder =
      process.env.NODE_ENV === 'development'
        ? join(process.cwd(), 'drizzle')
        : join(process.resourcesPath, 'drizzle')
    migrate(db, { migrationsFolder })
  } catch (error) {
    console.warn('Migration skipped (may be first run):', error)
  }
  
  return dbInstance
}

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (!dbInstance) {
    return initDb()
  }
  return dbInstance
}
