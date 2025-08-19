import { getDb } from '../db'
import { styles } from '../db/schema'
import { count, eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'

const DEFAULT_STYLES = [
  { name: '简约家居', description: '柔和光影，浅色背景，家居场景' },
  { name: '户外自然光', description: '自然光照，草地/天空感觉' },
  { name: '大理石台面', description: '冷白大理石台面，上方俯拍' },
  { name: '木质背景', description: '温暖原木背景，浅景深' },
]

export function seedStyles(): void {
  const db = getDb()
  const res = db.select({ c: count() }).from(styles).all()
  const total = res[0]?.c ?? 0
  if (total > 0) return
  for (const s of DEFAULT_STYLES) {
    db.insert(styles).values({
      id: randomUUID(),
      name: s.name,
      description: s.description,
      preset: null,
    }).run()
  }
}

