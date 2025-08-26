// Nuxt 4 Nitro plugin-style util to initialize Better Auth once.
// This file wires Better Auth with Postgres (Supabase) via Drizzle.
// Note: Requires packages: better-auth, drizzle-orm, pg and a provider (e.g., GitHub).

import type { H3Event } from 'h3'

let _auth: any | null = null

async function create() {
  const config = useRuntimeConfig()
  const databaseUrl = config.databaseUrl
  const secret = config.betterAuthSecret
  if (!databaseUrl || !secret) {
    console.warn('[better-auth] missing DATABASE_URL or BETTER_AUTH_SECRET')
  }

  // Lazy import to avoid build errors before deps are installed
  // @ts-ignore
  const { createAuth } = await import('better-auth')
  // @ts-ignore
  const { drizzle } = await import('drizzle-orm/node-postgres')
  // @ts-ignore
  const { Pool } = await import('pg')
  // @ts-ignore
  const { DrizzleAdapter } = await import('better-auth/adapters/drizzle')

  const pool = new Pool({ connectionString: databaseUrl })
  const db = drizzle(pool)

  const baseURL = config.public.siteUrl || ''

  const auth = createAuth({
    secret,
    baseURL,
    adapter: DrizzleAdapter(db),
    providers: [
      // Only email OTP login is supported. Configure in your Better Auth setup.
    ],
    // Customize cookies, session, etc. as needed
  })

  return auth
}

export async function getBetterAuth() {
  if (_auth) return _auth
  _auth = await create()
  return _auth
}

// Handle any /api/auth/* request using Better Auth’s handler (framework-agnostic)
export async function handleBetterAuth(event: H3Event) {
  const auth = await getBetterAuth()
  if (!auth) {
    return { status: 500, body: { ok: false, message: 'better-auth not initialized' } }
  }
  // Many auth libs expose a universal fetch-style handler. Adjust if API differs.
  // @ts-ignore
  if (typeof auth.handle === 'function') {
    // @ts-ignore
    return auth.handle(event)
  }
  // @ts-ignore
  if (typeof auth.toHandler === 'function') {
    // @ts-ignore
    return auth.toHandler()(event)
  }
  // @ts-ignore
  if (typeof auth.request === 'function') {
    // @ts-ignore
    return auth.request(event)
  }
  return { status: 501, body: { ok: false, message: 'better-auth handler not found' } }
}

// Convenience wrappers for email OTP flows. Adjust to better-auth API as needed.
export async function sendEmailOtp(email: string, redirectUri?: string) {
  const auth = await getBetterAuth()
  if (!auth) throw new Error('better-auth not initialized')
  // Example pseudo-API; replace with real better-auth call when available.
  // @ts-ignore
  if (auth.email && typeof auth.email.sendOtp === 'function') {
    // @ts-ignore
    return auth.email.sendOtp({ email, redirectUri })
  }
  throw new Error('Email OTP provider not configured in better-auth')
}

export async function verifyEmailOtp(email: string, code: string) {
  const auth = await getBetterAuth()
  if (!auth) throw new Error('better-auth not initialized')
  // @ts-ignore
  if (auth.email && typeof auth.email.verifyOtp === 'function') {
    // @ts-ignore
    return auth.email.verifyOtp({ email, code })
  }
  throw new Error('Email OTP provider not configured in better-auth')
}
