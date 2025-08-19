import { getDb } from '../db'
import { appSettings } from '../db/schema'
import { eq } from 'drizzle-orm'

export type SettingKey =
  | 'dashscope_api_key'
  | 'dashscope_endpoint'
  | 'dashscope_model'
  // OpenAI
  | 'openai_api_key'
  | 'openai_base_url'
  | 'openai_image_model'
  // DeepSeek
  | 'deepseek_api_key'
  | 'deepseek_base_url'
  | 'deepseek_image_model'

export function getSetting(key: SettingKey): string | null {
  const db = getDb()
  const row = db.select({ value: appSettings.value }).from(appSettings).where(eq(appSettings.key, key)).get()
  return (row as any)?.value ?? null
}

export function setSetting(key: SettingKey, value: string): void {
  const db = getDb()
  const exist = db.select({ key: appSettings.key }).from(appSettings).where(eq(appSettings.key, key)).get()
  if (exist) db.update(appSettings).set({ value }).where(eq(appSettings.key, key)).run()
  else db.insert(appSettings).values({ key, value }).run()
}

export function getAllSettings(): Record<string, string> {
  const db = getDb()
  const rows = db.select().from(appSettings).all() as any[]
  const out: Record<string, string> = {}
  for (const r of rows) out[r.key] = r.value
  return out
}
