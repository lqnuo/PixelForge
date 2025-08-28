// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/tailwind.css'],
  vite: {
    plugins: [tailwindcss()]
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@nuxt/ui'
  ],
  // Disable automatic font handling from @nuxt/ui (@nuxt/fonts)
  ui: {
    fonts: false
  },

  /**
   * Runtime configuration for auth/email delivery
   * You can expose public values via `public` if needed by client.
   * Fill these values in your environment (apps/official/.env):
   * - NUXT_AUTH_SECRET: secret used by Better Auth
   * - NUXT_RESEND_API_KEY (or SMTP creds if you wire a custom sender)
   * - NUXT_PUBLIC_AUTH_BASE_URL: site base URL (e.g. http://localhost:3000)
   */
  runtimeConfig: {
    authSecret: process.env.NUXT_AUTH_SECRET,
    resendApiKey: process.env.NUXT_RESEND_API_KEY,
    public: {
      authBaseUrl: process.env.NUXT_PUBLIC_AUTH_BASE_URL || ''
    }
  }
})
