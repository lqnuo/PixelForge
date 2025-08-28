import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import { createAuthClient } from 'better-auth/vue'
import { emailOTPClient } from 'better-auth/client/plugins'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // Prefer env-provided absolute URL if set (e.g., https://site.com)
  // Otherwise, createAuthClient will detect from window.location
  const baseURL = (config.public as any)?.authBaseUrl as string | undefined

  const auth = createAuthClient({
    baseURL,
    basePath: '/api/auth',
    plugins: [emailOTPClient()],
    fetchOptions: {
      // Ensure cookies are included for session endpoints
      credentials: 'include'
    }
  })

  return {
    provide: {
      auth
    }
  }
})

