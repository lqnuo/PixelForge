import { app } from 'electron'
import { eq } from 'drizzle-orm'
import { getDb } from './index'
import { appSettings, prompts, styles } from './schema'
import { seedPrompts as baseSeedPrompts } from '../prompts/seed'
import { randomUUID } from 'crypto'

// Wrap existing seeders with idempotent ensure-logic and version tracking

export function runDataMigrations(): void {
  const db = getDb()
  const currentVersion = app.getVersion()

  // Read last applied app version
  const last = db.select().from(appSettings).where(eq(appSettings.key, 'app.version')).all()

  // Always ensure defaults (safe, idempotent)
  ensureDefaultStyles()
  ensureDefaultPrompts()

  // Future: add versioned data migrations here
  // if (!lastVersion || semverLt(lastVersion, '0.2.0')) { ... }

  // Persist current version as applied
  const existing = db.select().from(appSettings).where(eq(appSettings.key, 'app.version')).all()
  if (existing.length === 0) {
    db.insert(appSettings).values({ key: 'app.version', value: currentVersion }).run()
  } else {
    db
      .update(appSettings)
      .set({ value: currentVersion })
      .where(eq(appSettings.key, 'app.version'))
      .run()
  }
}

function ensureDefaultPrompts(): void {
  const db = getDb()
  // Run base seeder (inserts if empty)
  baseSeedPrompts()

  // For shipped prompt ids, upsert and refresh content on upgrades
  const DEFAULTS = [
    {
      id: 'outpainting',
      name: '智能扩图',
      description: '基于原图内容智能扩展画面，保持原始风格和构图',
      prompt: 'expand and extend the image naturally while maintaining the original style and composition',
      category: 'outpainting',
    },
    {
      id: 'enhance',
      name: '图像增强',
      description: '提升图像质量，增强细节和清晰度',
      prompt: 'enhance image quality, improve details and sharpness while preserving the original content',
      category: 'enhancement',
    },
    {
      id: 'colorize',
      name: '智能上色',
      description: '为黑白图像添加自然色彩',
      prompt: 'add natural colors to black and white image, maintain realistic tones',
      category: 'colorization',
    },
  ]

  for (const p of DEFAULTS) {
    const found = db.select().from(prompts).where(eq(prompts.id, p.id)).all()
    if (found.length === 0) {
      db.insert(prompts).values(p).run()
    } else {
      // Update shipped defaults to latest content (user can add their own rows separately)
      db
        .update(prompts)
        .set({ name: p.name, description: p.description, prompt: p.prompt, category: p.category })
        .where(eq(prompts.id, p.id))
        .run()
    }
  }
}

// no-op helper removed; using randomUUID directly
