import { defineEventHandler, getHeaders, getRequestURL, readRawBody } from 'h3'
import { betterAuth } from 'better-auth'
import { emailOTP } from 'better-auth/plugins/email-otp'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'

// Ensure a persistent SQLite database under apps/official/.data
const dataDir = join(process.cwd(), '.data')
try {
  mkdirSync(dataDir, { recursive: true })
} catch {}
const dbPath = join(dataDir, 'auth.db')
const sqlite = new Database(dbPath)
const db = drizzle(sqlite)

// Configure Better Auth for email OTP only
const auth = betterAuth({
  // Align with this Nitro route: /api/auth/**
  basePath: '/api/auth',
  // Use runtime env if provided. In dev, a fallback avoids crashes.
  secret: process.env.NUXT_AUTH_SECRET || 'dev-secret-change-me',

  // Use Drizzle adapter with SQLite
  database: drizzleAdapter(db, { provider: 'sqlite' }),

  // Explicitly disable password flow; we only support email OTP
  emailAndPassword: { enabled: false },

  plugins: [
    emailOTP({
      // Disable sign-up by default? Set to false to allow creating users after email verification.
      disableSignUp: false,
      // Implement your email delivery here. For now, log to server for dev.
      async sendVerificationOTP({ email, otp, type }) {
        // TODO: integrate your email provider (Resend/SMTP) here
        console.log(`[better-auth] OTP for ${email} [${type}]:`, otp)
      }
    })
  ]
})

export default defineEventHandler(async (event) => {
  // Convert H3 event to Web Request for better-auth handler
  const url = getRequestURL(event)
  const headersObj = getHeaders(event)
  const headers = new Headers()
  for (const [key, value] of Object.entries(headersObj)) {
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, String(v))
    } else if (value != null) {
      headers.set(key, String(value))
    }
  }

  const method = event.method || 'GET'
  const bodyNeeded = method !== 'GET' && method !== 'HEAD'
  const raw = bodyNeeded ? await readRawBody(event) : undefined

  const request = new Request(url.toString(), {
    method,
    headers,
    body: raw as any
  })

  // Delegate to Better Auth router; returns a Web Response
  const response = await auth.handler(request)
  return response
})

