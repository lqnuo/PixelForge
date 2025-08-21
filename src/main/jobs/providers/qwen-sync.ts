import { logger } from '../../utils/log'
import { getSetting } from '../../utils/settings'
import { BaseImageProvider, ImageGenerationOptions, ImageGenerationResult, calcTargetSize } from '../types'

export class QwenSyncProvider extends BaseImageProvider {
  async processImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const { input, aspect, promptText } = options
    const apiKey = getSetting('dashscope_api_key') || ''
    if (!apiKey) throw new Error('MISSING_API_KEY')

    let endpoint = getSetting('dashscope_endpoint')?.trim() ||
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'
    
    // Auto-migrate old endpoint to new endpoint
    if (endpoint === 'https://dashscope.aliyuncs.com/api/v1/services/images/editing') {
      endpoint = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'
      logger.info('Auto-migrated Qwen endpoint from old to new format')
    }

    const model = getSetting('dashscope_model')?.trim() || 'qwen-image-edit'
    const size = calcTargetSize(aspect)
    const finalPromptText = promptText || '扩展图片，保持原图内容完整，自然地扩展背景和周围环境'

    const payload = {
      model,
      input: {
        messages: [
          {
            role: 'user',
            content: [
              {
                image: `data:image/png;base64,${input.toString('base64')}`
              },
              {
                text: finalPromptText
              }
            ]
          }
        ]
      },
      parameters: {
        negative_prompt: '',
        watermark: false
      }
    }

    const _fetch = this.getFetch()

    // Log request details for debugging
    logger.info('Qwen sync outpaint request', {
      endpoint,
      model,
      size: `${size.w}x${size.h}`,
      aspect,
      promptText: finalPromptText,
      payloadKeys: Object.keys(payload),
      inputImageLength: input.length
    })

    const res = await _fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      let responseData = null
      try {
        responseData = JSON.parse(text)
      } catch {
        // text is not JSON
      }
      
      logger.error('Qwen sync outpaint request failed', { 
        endpoint,
        status: res.status,
        statusText: res.statusText,
        responseText: text,
        responseData,
        requestPayload: {
          model,
          inputMessageCount: payload.input?.messages?.length,
          contentCount: payload.input?.messages?.[0]?.content?.length,
          parameters: payload.parameters
        }
      })
      throw new Error(`QWEN_HTTP_${res.status}`)
    }

    const data = await res.json()
    
    // Log successful response for debugging
    logger.info('Qwen sync outpaint response received', {
      responseKeys: Object.keys(data),
      outputKeys: data.output ? Object.keys(data.output) : null,
      choicesCount: data?.output?.choices?.length,
      usageKeys: data.usage ? Object.keys(data.usage) : null,
      usage: data.usage
    })
    
    // Handle the actual API response format:
    // { output: { choices: [{ message: { content: [{ image: "url" }] } }] }, usage: { width, height } }
    const imageUrl = data?.output?.choices?.[0]?.message?.content?.[0]?.image
    if (!imageUrl) {
      logger.error('Qwen sync outpaint response missing image URL', { 
        response: data,
        outputStructure: {
          hasOutput: !!data.output,
          hasChoices: !!data?.output?.choices,
          choicesLength: data?.output?.choices?.length,
          firstChoice: data?.output?.choices?.[0],
          messageContent: data?.output?.choices?.[0]?.message?.content
        }
      })
      throw new Error('QWEN_INVALID_RESPONSE')
    }

    logger.info('Extracted image URL from sync response', { imageUrl })

    // Download the image from the URL
    const imageRes = await _fetch(imageUrl)
    if (!imageRes.ok) {
      logger.error('Failed to download image from Qwen URL', { url: imageUrl, status: imageRes.status })
      throw new Error('QWEN_IMAGE_DOWNLOAD_FAILED')
    }

    const imageBuffer = Buffer.from(await imageRes.arrayBuffer())
    const mime = imageRes.headers.get('content-type') || 'image/png'
    const width = data?.usage?.width
    const height = data?.usage?.height
    
    return { mime, data: imageBuffer, width, height }
  }
}
