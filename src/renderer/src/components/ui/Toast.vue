<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast" tag="div" class="space-y-2">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'toast-item',
            getToastStyles(toast.type)
          ]"
          @click="removeToast(toast.id)"
        >
          <div class="flex items-center gap-3">
            <component :is="getIcon(toast.type)" class="h-5 w-5 shrink-0" />
            <div class="flex-1">
              <div v-if="toast.title" class="font-medium text-sm">{{ toast.title }}</div>
              <div class="text-sm" :class="toast.title ? 'opacity-90' : ''">{{ toast.message }}</div>
            </div>
            <button
              class="opacity-60 hover:opacity-100 transition-opacity p-1"
              @click.stop="removeToast(toast.id)"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
          <!-- 进度条 -->
          <div
            class="absolute bottom-0 left-0 h-1 bg-current opacity-30 transition-all"
            :style="{ 
              width: `${(toast.remainingTime / toast.duration) * 100}%`,
              transitionDuration: '100ms'
            }"
          ></div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-vue-next'

export interface ToastItem {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration: number
  remainingTime: number
}

const toasts = ref<ToastItem[]>([])
let intervalId: number | null = null

// 图标映射
const getIcon = (type: ToastItem['type']) => {
  switch (type) {
    case 'success': return CheckCircle
    case 'error': return XCircle
    case 'warning': return AlertCircle
    case 'info': return Info
  }
}

// 样式映射
const getToastStyles = (type: ToastItem['type']) => {
  switch (type) {
    case 'success': return 'toast-success'
    case 'error': return 'toast-error'
    case 'warning': return 'toast-warning'
    case 'info': return 'toast-info'
  }
}

// 添加Toast
const addToast = (options: Omit<ToastItem, 'id' | 'remainingTime'>) => {
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
  const toast: ToastItem = {
    ...options,
    id,
    remainingTime: options.duration
  }
  
  toasts.value.push(toast)
  
  // 限制Toast数量
  if (toasts.value.length > 5) {
    toasts.value.shift()
  }
  
  return id
}

// 移除Toast
const removeToast = (id: string) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

// 更新倒计时
const updateToasts = () => {
  toasts.value = toasts.value.filter(toast => {
    toast.remainingTime -= 100
    if (toast.remainingTime <= 0) {
      return false
    }
    return true
  })
}

onMounted(() => {
  intervalId = setInterval(updateToasts, 100) as any
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})

// 导出方法供全局使用
defineExpose({
  addToast,
  removeToast
})
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  max-width: 400px;
  pointer-events: none;
}

.toast-item {
  @apply card-base p-4 shadow-floating backdrop-blur-xl relative overflow-hidden;
  pointer-events: auto;
  cursor: pointer;
  min-width: 320px;
}

.toast-success {
  @apply bg-emerald-50 text-emerald-900 border-emerald-200;
}

.toast-error {
  @apply bg-red-50 text-red-900 border-red-200;
}

.toast-warning {
  @apply bg-amber-50 text-amber-900 border-amber-200;
}

.toast-info {
  @apply bg-blue-50 text-blue-900 border-blue-200;
}

.dark .toast-success {
  @apply bg-emerald-900/20 text-emerald-100 border-emerald-800;
}

.dark .toast-error {
  @apply bg-red-900/20 text-red-100 border-red-800;
}

.dark .toast-warning {
  @apply bg-amber-900/20 text-amber-100 border-amber-800;
}

.dark .toast-info {
  @apply bg-blue-900/20 text-blue-100 border-blue-800;
}

/* 动画效果 */
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
