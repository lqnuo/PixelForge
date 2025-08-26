// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/ui'
  ],
  runtimeConfig: {
    // Server-only
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    databaseUrl: process.env.DATABASE_URL,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    smtpFrom: process.env.SMTP_FROM,
    // Public (exposed to client)
    public: {
      siteUrl: process.env.SITE_URL || '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
    }
  }
})
