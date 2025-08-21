export type TargetAspect = '1:1' | '3:4'

export interface ImageGenerationResult {
  mime: string
  data: Buffer
  width?: number
  height?: number
}

export interface ImageGenerationOptions {
  input: Buffer
  aspect: TargetAspect
  promptText?: string
}

export interface TargetSize {
  w: number
  h: number
}

export function calcTargetSize(aspect: TargetAspect): TargetSize {
  // Keep sizes in a common max boundary; adjust as needed
  if (aspect === '1:1') return { w: 1024, h: 1024 }
  // 3:4 portrait
  return { w: 768, h: 1024 }
}

export abstract class BaseImageProvider {
  abstract processImage(options: ImageGenerationOptions): Promise<ImageGenerationResult>
  
  protected getFetch(): any {
    const _fetch: any = (globalThis as any).fetch
    if (typeof _fetch !== 'function') {
      throw new Error('FETCH_NOT_AVAILABLE')
    }
    return _fetch
  }
}
