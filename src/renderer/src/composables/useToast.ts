import { ref } from 'vue'

// 全局Toast实例引用
const toastInstance = ref<any>(null)

export function useToast() {
  // 设置Toast实例
  const setToastInstance = (instance: any) => {
    toastInstance.value = instance
  }
  
  // 显示成功消息
  const success = (message: string, title?: string, duration = 4000) => {
    if (!toastInstance.value) return
    return toastInstance.value.addToast({
      type: 'success',
      message,
      title,
      duration
    })
  }
  
  // 显示错误消息
  const error = (message: string, title?: string, duration = 6000) => {
    if (!toastInstance.value) return
    return toastInstance.value.addToast({
      type: 'error',
      message,
      title,
      duration
    })
  }
  
  // 显示警告消息
  const warning = (message: string, title?: string, duration = 5000) => {
    if (!toastInstance.value) return
    return toastInstance.value.addToast({
      type: 'warning',
      message,
      title,
      duration
    })
  }
  
  // 显示信息消息
  const info = (message: string, title?: string, duration = 4000) => {
    if (!toastInstance.value) return
    return toastInstance.value.addToast({
      type: 'info',
      message,
      title,
      duration
    })
  }
  
  // 移除指定Toast
  const remove = (id: string) => {
    if (!toastInstance.value) return
    toastInstance.value.removeToast(id)
  }
  
  // 快捷方法
  const toast = {
    success,
    error,
    warning,
    info,
    remove
  }
  
  return {
    setToastInstance,
    success,
    error,
    warning,
    info,
    remove,
    toast
  }
}

// 导出单例实例
export const toastManager = useToast()
