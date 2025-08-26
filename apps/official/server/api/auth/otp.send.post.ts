import { readBody, setResponseStatus } from 'h3'
import { sendEmailOtp } from '../plugins/better-auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const email = String(body?.email || '').trim().toLowerCase()
  const redirectUri = body?.redirect_uri ? String(body.redirect_uri) : undefined
  if (!email) {
    setResponseStatus(event, 400)
    return { ok: false, message: 'email required' }
  }
  try {
    const res = await sendEmailOtp(email, redirectUri)
    return { ok: true, result: res }
  } catch (e: any) {
    setResponseStatus(event, 500)
    return { ok: false, message: e?.message || 'failed to send otp' }
  }
})
