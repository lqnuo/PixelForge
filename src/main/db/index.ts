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
  // basic pragmas for stability
  sqlite.pragma('journal_mode = WAL')
  ensureSchema(sqlite)
  dbInstance = drizzle(sqlite)
  return dbInstance
}

export function getDb(): BetterSQLite3Database {
  if (!dbInstance) {
    return initDb()
  }
  return dbInstance
}

function ensureSchema(sqlite: Database.Database) {
  // Create tables and indexes if not exist (first-run or upgrades)
  const ddl = `
  CREATE TABLE IF NOT EXISTS images (
    id TEXT PRIMARY KEY,
    filename TEXT,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    sha256 TEXT NOT NULL UNIQUE,
    data_blob BLOB NOT NULL,
    preview_base64 TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_images_sha256 ON images(sha256);

  CREATE TABLE IF NOT EXISTS styles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    preset TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    source_image_id TEXT NOT NULL,
    style_id TEXT,
    aspect_ratio TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    error TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );
  CREATE INDEX IF NOT EXISTS idx_jobs_source_image_id ON jobs(source_image_id);

  CREATE TABLE IF NOT EXISTS results (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    source_image_id TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    data_blob BLOB NOT NULL,
    preview_base64 TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );
  CREATE INDEX IF NOT EXISTS idx_results_source_image_id ON results(source_image_id);
  CREATE INDEX IF NOT EXISTS idx_results_job_id ON results(job_id);
  `
  sqlite.exec(ddl)
}
