import { getSetting } from '../utils/settings'
import { QwenSyncProvider } from './providers/qwen-sync'
import { WanxAsyncProvider } from './providers/wanx-async'
import { TargetAspect, ImageGenerationResult, ImageGenerationOptions } from './types'

// 判断是否为异步模型
function isAsyncModel(model: string): boolean {
  return model.includes('wanx')
}

// Provider 工厂
function createProvider(model: string) {
  if (isAsyncModel(model)) {
    return new WanxAsyncProvider()
  } else {
    return new QwenSyncProvider()
  }
}

export async function outpaintWithQwen(
  input: Buffer,
  aspect: TargetAspect,
  promptText?: string
): Promise<ImageGenerationResult> {
  const model = getSetting('dashscope_model')?.trim() || 'qwen-image-edit'
  
  const options: ImageGenerationOptions = {
    input,
    aspect,
    promptText
  }

  const provider = createProvider(model)
  return await provider.processImage(options)
}