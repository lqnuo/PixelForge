import { logger } from '../../utils/log'
import { getSetting } from '../../utils/settings'
import { BaseImageProvider, ImageGenerationOptions, ImageGenerationResult } from '../types'

export class QwenSyncProvider extends BaseImageProvider {
  async processImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const { input, promptText } = options
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

    const response = await this.makeRequest({
      method: 'POST',
      url: endpoint,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      data: payload
    })

    const data = response.data
    
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

    // Download the image from the URL
    const { buffer: imageBuffer, mime } = await this.downloadImage(imageUrl)
    const width = data?.usage?.width
    const height = data?.usage?.height
    
    return { mime, data: imageBuffer, width, height }
  }
}
