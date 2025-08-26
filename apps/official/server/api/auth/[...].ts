import { handleBetterAuth } from '../plugins/better-auth'

// Universal handler for /api/auth/* delegated to Better Auth.
export default defineEventHandler(async (event) => {
  const result = await handleBetterAuth(event)
  // If handler returns a plain object, just return it. If it returns a Response, send it.
  if (!result) return null
  // Nitro allows returning Response objects; otherwise, map basic shape
  // Attempt to detect a Response
  if (typeof Response !== 'undefined' && result instanceof Response) {
    return result
  }
  const { status, headers, body, redirect } = result as any
  if (redirect) {
    setResponseStatus(event, redirect.status || 302)
    setHeader(event, 'Location', redirect.location)
    return ''
  }
  if (headers) {
    for (const [k, v] of Object.entries(headers)) setHeader(event, k, String(v))
  }
  if (status) setResponseStatus(event, status)
  return body ?? result
})
