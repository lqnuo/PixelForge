import { logger } from '../utils/log'
import { getSetting } from '../utils/settings'

type TargetAspect = '1:1' | '3:4'

function calcTargetSize(aspect: TargetAspect): { w: number; h: number } {
  // Keep sizes in a common max boundary; adjust as needed
  if (aspect === '1:1') return { w: 1024, h: 1024 }
  // 3:4 portrait
  return { w: 768, h: 1024 }
}

export async function outpaintWithQwen(
  input: Buffer,
  aspect: TargetAspect
): Promise<{ mime: string; data: Buffer; width?: number; height?: number }> {
  const apiKey = getSetting('dashscope_api_key') || ''
  if (!apiKey) throw new Error('MISSING_API_KEY')
  const endpoint =
    getSetting('dashscope_endpoint')?.trim() ||
    'https://dashscope.aliyuncs.com/api/v1/services/images/editing'
  const model = getSetting('dashscope_model')?.trim() || 'qwen-image-edit'

  const size = calcTargetSize(aspect)

  const payload: any = {
    model,
    input_image: input.toString('base64'),
    edit_type: 'outpainting',
    size: `${size.w}x${size.h}`,
    parameters: {
      // Adjust strategy as needed per API spec
      outpainting_mode: 'balanced'
    }
  }

  const _fetch: any = (globalThis as any).fetch
  if (typeof _fetch !== 'function') {
    throw new Error('FETCH_NOT_AVAILABLE')
  }
  const res = await _fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  } as any)

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    logger.error('Qwen outpaint request failed', { status: res.status, text })
    throw new Error(`QWEN_HTTP_${res.status}`)
  }
  const data = (await res.json()) as any
  // Expecting { output: { image_base64: '...', mime_type?: 'image/png', width?, height? } }
  const imageBase64 = data?.output?.image_base64 || data?.data || data?.image || null
  if (!imageBase64) {
    logger.error('Qwen outpaint response missing image')
    throw new Error('QWEN_INVALID_RESPONSE')
  }
  const mime = data?.output?.mime_type || 'image/png'
  const width = data?.output?.width
  const height = data?.output?.height
  return { mime, data: Buffer.from(imageBase64, 'base64'), width, height }
}
