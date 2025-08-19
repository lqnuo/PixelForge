import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const images = sqliteTable('images', {
  id: text('id').primaryKey(),
  filename: text('filename'),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  width: integer('width'),
  height: integer('height'),
  sha256: text('sha256').notNull().unique(),
  dataBlob: blob('data_blob').notNull(),
  previewBase64: text('preview_base64'),
  // 分组：可为空
  groupId: text('group_id'),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s','now'))`),
})

export const styles = sqliteTable('styles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  preset: text('preset', { mode: 'json' }),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s','now'))`),
})

export const jobs = sqliteTable('jobs', {
  id: text('id').primaryKey(),
  sourceImageId: text('source_image_id').notNull(),
  styleId: text('style_id'),
  aspectRatio: text('aspect_ratio').notNull(),
  status: text('status').notNull().default('queued'),
  error: text('error'),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s','now'))`),
  updatedAt: integer('updated_at').notNull().default(sql`(strftime('%s','now'))`),
})

export const results = sqliteTable('results', {
  id: text('id').primaryKey(),
  jobId: text('job_id').notNull(),
  sourceImageId: text('source_image_id').notNull(),
  mimeType: text('mime_type').notNull(),
  width: integer('width'),
  height: integer('height'),
  dataBlob: blob('data_blob').notNull(),
  previewBase64: text('preview_base64'),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s','now'))`),
})

export const groups = sqliteTable('groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s','now'))`),
})

export const appSettings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value')
})
