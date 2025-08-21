import { existsSync, mkdirSync } from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

// Simple, Electron-free DB seeding for local/dev usage
async function main() {
  const cwd = process.cwd()
  const dbDir = process.env.QWAN_DB_DIR || path.join(cwd, '.local-dev')
  const dbPath = process.env.QWAN_DB_PATH || path.join(dbDir, 'app.db')

  if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true })

  const sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  const db = drizzle(sqlite)

  // Run migrations from local drizzle folder
  const migrationsFolder = path.join(cwd, 'drizzle')
  migrate(db, { migrationsFolder })

  // Idempotent defaults — match app logic
  seedStyles(sqlite)
  seedPrompts(sqlite)

  // Record app version (best-effort)
  const appVersion = process.env.npm_package_version || 'dev'
  sqlite
    .prepare("INSERT INTO settings(key, value) VALUES('app.version', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value")
    .run(appVersion)

  console.log('DB seeded at', dbPath)
}

function seedStyles(sqlite) {
  const defaults = [
    { name: '简约家居', description: '柔和光影，浅色背景，家居场景' },
    { name: '户外自然光', description: '自然光照，草地/天空感觉' },
    { name: '大理石台面', description: '冷白大理石台面，上方俯拍' },
    { name: '木质背景', description: '温暖原木背景，浅景深' },
  ]

  const findByName = sqlite.prepare('SELECT id FROM styles WHERE name = ? LIMIT 1')
  const insert = sqlite.prepare('INSERT INTO styles (id, name, description, preset) VALUES (?, ?, ?, NULL)')

  // Ensure table exists before seeding (no-op if not migrated)
  try {
    for (const s of defaults) {
      const existing = findByName.get(s.name)
      if (!existing) {
        insert.run(cryptoRandomUUID(), s.name, s.description || null)
      }
    }
  } catch (e) {
    // If table missing, migrations likely didn’t run; let main throw if migrate failed
    throw e
  }
}

function seedPrompts(sqlite) {
  const defaults = [
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

  const getById = sqlite.prepare('SELECT id FROM prompts WHERE id = ? LIMIT 1')
  const insert = sqlite.prepare(
    'INSERT INTO prompts (id, name, description, prompt, category) VALUES (?, ?, ?, ?, ?)' 
  )
  const update = sqlite.prepare(
    'UPDATE prompts SET name = ?, description = ?, prompt = ?, category = ? WHERE id = ?'
  )

  for (const p of defaults) {
    const existing = getById.get(p.id)
    if (!existing) {
      insert.run(p.id, p.name, p.description || null, p.prompt, p.category || 'general')
    } else {
      update.run(p.name, p.description || null, p.prompt, p.category || 'general', p.id)
    }
  }
}

function cryptoRandomUUID() {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID()
  // Fallback simple UUIDv4 (not RFC-4122 strict, but fine for local seeds)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

main().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})

