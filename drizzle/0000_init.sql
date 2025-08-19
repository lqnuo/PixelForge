-- Drizzle initial migration (hand-authored to match src/main/db/schema.ts)
CREATE TABLE IF NOT EXISTS `images` (
  `id` text PRIMARY KEY NOT NULL,
  `filename` text,
  `mime_type` text NOT NULL,
  `size_bytes` integer NOT NULL,
  `width` integer,
  `height` integer,
  `sha256` text NOT NULL UNIQUE,
  `data_blob` blob NOT NULL,
  `preview_base64` text,
  `created_at` integer NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS `idx_images_sha256` ON `images` (`sha256`);

CREATE TABLE IF NOT EXISTS `styles` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `description` text,
  `preset` text,
  `created_at` integer NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE TABLE IF NOT EXISTS `jobs` (
  `id` text PRIMARY KEY NOT NULL,
  `source_image_id` text NOT NULL,
  `style_id` text,
  `aspect_ratio` text NOT NULL,
  `status` text NOT NULL DEFAULT 'queued',
  `error` text,
  `created_at` integer NOT NULL DEFAULT (strftime('%s','now')),
  `updated_at` integer NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE INDEX IF NOT EXISTS `idx_jobs_source_image_id` ON `jobs` (`source_image_id`);

CREATE TABLE IF NOT EXISTS `results` (
  `id` text PRIMARY KEY NOT NULL,
  `job_id` text NOT NULL,
  `source_image_id` text NOT NULL,
  `mime_type` text NOT NULL,
  `width` integer,
  `height` integer,
  `data_blob` blob NOT NULL,
  `preview_base64` text,
  `created_at` integer NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE INDEX IF NOT EXISTS `idx_results_source_image_id` ON `results` (`source_image_id`);
CREATE INDEX IF NOT EXISTS `idx_results_job_id` ON `results` (`job_id`);

