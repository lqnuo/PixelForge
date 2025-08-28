// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Use `app/` as source directory so routing reads from `app/pages/**`
  srcDir: 'app',
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@nuxt/ui'
  ]
  ,
  // Disable automatic font handling from @nuxt/ui (@nuxt/fonts)
  ui: {
    fonts: false
  }
})
