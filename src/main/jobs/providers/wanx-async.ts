import { logger } from '../../utils/log'
import { getSetting } from '../../utils/settings'
import { BaseImageProvider, ImageGenerationOptions, ImageGenerationResult, calcTargetSize } from '../types'

interface WanxAsyncTaskResponse {
  output?: {
    task_id: string
  }
  request_id: string
}

interface WanxAsyncResultResponse {
  output?: {
    task_status: string
    results?: Array<{
      url: string
    }>
  }
  request_id: string
}

export class WanxAsyncProvider extends BaseImageProvider {
  async processImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const { input, aspect, promptText } = options
    const apiKey = getSetting('dashscope_api_key') || ''
    if (!apiKey) throw new Error('MISSING_API_KEY')

    const model = getSetting('dashscope_model')?.trim() || 'wanx2.1-imageedit'
    const size = calcTargetSize(aspect)
    const finalPromptText = promptText || '扩展图片，保持原图内容完整，自然地扩展背景和周围环境'

    // 使用新的 API 格式
    const endpoint = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image2image/image-synthesis'

    const payload = {
      model,
      input: {
        function: 'expand',
        prompt: finalPromptText,
        base_image_url: `data:image/png;base64,${input.toString('base64')}`
      },
      parameters: {
        top_scale: 1.5,
        bottom_scale: 1.5,
        left_scale: 1.5,
        right_scale: 1.5,
        n: 1
      }
    }

    const _fetch = this.getFetch()

    // Log request details for debugging
    logger.info('Wanx async outpaint task creation', {
      endpoint,
      model,
      size: `${size.w}x${size.h}`,
      aspect,
      promptText: finalPromptText,
      payloadKeys: Object.keys(payload),
      inputImageLength: input.length
    })

    // 第一步：创建异步任务
    const taskRes = await _fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-DashScope-Async': 'enable',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    })

    if (!taskRes.ok) {
      const text = await taskRes.text().catch(() => '')
      let responseData = null
      try {
        responseData = JSON.parse(text)
      } catch {
        // text is not JSON
      }
      
      logger.error('Wanx async task creation failed', { 
        endpoint,
        status: taskRes.status,
        statusText: taskRes.statusText,
        responseText: text,
        responseData
      })
      throw new Error(`WANX_ASYNC_CREATE_FAILED_${taskRes.status}`)
    }

    const taskData = (await taskRes.json()) as WanxAsyncTaskResponse
    const taskId = taskData?.output?.task_id

    if (!taskId) {
      logger.error('Wanx async task creation response missing task_id', { response: taskData })
      throw new Error('WANX_ASYNC_INVALID_TASK_RESPONSE')
    }

    logger.info('Wanx async task created', { taskId, requestId: taskData.request_id })

    // 第二步：轮询查询任务结果
    return await this.pollTaskResult(taskId, apiKey, size)
  }

  private async pollTaskResult(
    taskId: string, 
    apiKey: string, 
    size: { w: number; h: number }
  ): Promise<ImageGenerationResult> {
    const queryEndpoint = 'https://dashscope.aliyuncs.com/api/v1/tasks'
    const maxAttempts = 30 // 最多等待5分钟 (30 * 10秒)
    let attempts = 0
    const _fetch = this.getFetch()

    while (attempts < maxAttempts) {
      attempts++
      
      // 等待10秒再查询
      await new Promise(resolve => setTimeout(resolve, 10000))

      logger.info('Wanx async task polling', { taskId, attempt: attempts, maxAttempts })

      const queryRes = await _fetch(`${queryEndpoint}/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })

      if (!queryRes.ok) {
        logger.warn('Wanx async task query failed', { 
          taskId, 
          attempt: attempts, 
          status: queryRes.status 
        })
        continue
      }

      const queryData = (await queryRes.json()) as WanxAsyncResultResponse
      const taskStatus = queryData?.output?.task_status

      logger.info('Wanx async task status', { 
        taskId, 
        attempt: attempts, 
        status: taskStatus,
        hasResults: !!queryData?.output?.results?.length
      })

      if (taskStatus === 'SUCCEEDED') {
        const imageUrl = queryData?.output?.results?.[0]?.url
        if (!imageUrl) {
          logger.error('Wanx async task succeeded but missing image URL', { 
            taskId, 
            response: queryData 
          })
          throw new Error('WANX_ASYNC_MISSING_IMAGE_URL')
        }

        logger.info('Wanx async task completed, downloading image', { taskId, imageUrl })

        // 下载图片
        const imageRes = await _fetch(imageUrl)
        if (!imageRes.ok) {
          logger.error('Failed to download async image from Wanx URL', { 
            taskId, 
            url: imageUrl, 
            status: imageRes.status 
          })
          throw new Error('WANX_ASYNC_IMAGE_DOWNLOAD_FAILED')
        }

        const imageBuffer = Buffer.from(await imageRes.arrayBuffer())
        const mime = imageRes.headers.get('content-type') || 'image/png'
        
        return { 
          mime, 
          data: imageBuffer, 
          width: size.w, 
          height: size.h 
        }
      } else if (taskStatus === 'FAILED') {
        logger.error('Wanx async task failed', { taskId, response: queryData })
        throw new Error('WANX_ASYNC_TASK_FAILED')
      }

      // 任务还在进行中，继续等待
    }

    // 超时
    logger.error('Wanx async task timeout', { taskId, attempts: maxAttempts })
    throw new Error('WANX_ASYNC_TASK_TIMEOUT')
  }
}
