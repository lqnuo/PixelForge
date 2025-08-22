import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { logger } from '../utils/log'

// 扩展 config 类型以支持 metadata
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    requestId: string
    startTime: number
  }
}

// 创建 axios 实例
const axiosInstance: AxiosInstance = axios.create({
  timeout: 300000, // 5分钟超时，适合异步任务
})

// 请求拦截器
axiosInstance.interceptors.request.use(
  (config: CustomAxiosRequestConfig) => {
    const requestId = Math.random().toString(36).substring(2, 15)
    config.metadata = { requestId, startTime: Date.now() }

    logger.info('HTTP Request', {
      requestId,
      method: config.method?.toUpperCase() || 'GET',
      url: config.url,
      headers: sanitizeHeaders(config.headers || {}),
      bodySize: config.data ? getDataSize(config.data) : 0,
      hasData: !!config.data,
      timeout: config.timeout
    })

    return config
  },
  (error: AxiosError) => {
    logger.error('Request Setup Error', {
      error: error.message,
      stack: error.stack
    })
    return Promise.reject(error)
  }
)

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    const config = response.config as CustomAxiosRequestConfig
    const requestId = config.metadata?.requestId
    const duration = config.metadata?.startTime ? Date.now() - config.metadata.startTime : 0

    logger.info('HTTP Response', {
      requestId,
      method: config.method?.toUpperCase() || 'GET',
      url: config.url,
      status: response.status,
      statusText: response.statusText,
      duration: `${duration}ms`,
      responseHeaders: sanitizeHeaders(response.headers),
      dataSize: response.data ? getDataSize(response.data) : 0,
      responseKeys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : [],
      contentType: response.headers['content-type']
    })

    return response
  },
  (error: AxiosError) => {
    const config = error.config as CustomAxiosRequestConfig
    const requestId = config?.metadata?.requestId
    const duration = config?.metadata?.startTime ? Date.now() - config.metadata.startTime : 0

    if (error.response) {
      // 服务器响应了错误状态码
      logger.error('HTTP Response Error', {
        requestId,
        method: config?.method?.toUpperCase() || 'GET',
        url: config?.url,
        status: error.response.status,
        statusText: error.response.statusText,
        duration: `${duration}ms`,
        errorMessage: error.message,
        responseData: error.response.data,
        responseHeaders: sanitizeHeaders(error.response.headers)
      })
    } else if (error.request) {
      // 请求发送了但没有收到响应
      logger.error('HTTP Network Error', {
        requestId,
        method: config?.method?.toUpperCase() || 'GET',
        url: config?.url,
        duration: `${duration}ms`,
        errorMessage: error.message,
        code: error.code
      })
    } else {
      // 请求配置错误
      logger.error('HTTP Request Config Error', {
        requestId,
        errorMessage: error.message,
        config: config ? {
          method: config.method,
          url: config.url
        } : null
      })
    }

    return Promise.reject(error)
  }
)

// 工具函数：隐藏敏感头信息
function sanitizeHeaders(headers: any): any {
  if (!headers) return {}
  
  const sanitized = { ...headers }
  
  // 隐藏敏感信息
  if (sanitized.Authorization || sanitized.authorization) {
    sanitized.Authorization = 'Bearer ***'
    delete sanitized.authorization
  }
  
  // 只保留重要的头信息用于日志
  const importantHeaders = [
    'content-type', 'content-length', 'authorization', 'x-dashscope-async',
    'accept', 'user-agent', 'cache-control'
  ]
  
  const filtered: any = {}
  for (const key in sanitized) {
    if (importantHeaders.includes(key.toLowerCase())) {
      filtered[key] = sanitized[key]
    }
  }
  
  return filtered
}

// 工具函数：获取数据大小
function getDataSize(data: any): number {
  if (!data) return 0
  
  if (typeof data === 'string') {
    return data.length
  }
  
  if (data instanceof Buffer) {
    return data.length
  }
  
  if (data instanceof ArrayBuffer) {
    return data.byteLength
  }
  
  try {
    return JSON.stringify(data).length
  } catch {
    return 0
  }
}

export default axiosInstance
