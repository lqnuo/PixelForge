import { readBody, setResponseStatus } from 'h3'
import { verifyEmailOtp } from '../plugins/better-auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const email = String(body?.email || '').trim().toLowerCase()
  const code = String(body?.code || '').trim()
  const redirectUri = body?.redirect_uri ? String(body.redirect_uri) : undefined
  if (!email || !code) {
    setResponseStatus(event, 400)
    return { ok: false, message: 'email and code required' }
  }
  try {
    const session = await verifyEmailOtp(email, code)
    // Optionally set cookie/session here if better-auth returns it automatically.
    // If a redirect_uri is provided, redirect with a token in query.
    if (redirectUri) {
      const token = session?.token || session?.accessToken || ''
      setResponseStatus(event, 302)
      setHeader(event, 'Location', `${redirectUri}${redirectUri.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`)
      return ''
    }
    return { ok: true, session }
  } catch (e: any) {
    setResponseStatus(event, 401)
    return { ok: false, message: e?.message || 'invalid code' }
  }
})
