import { ref, computed, watch, onMounted, readonly } from 'vue'

export type Theme = 'light' | 'dark' | 'system'

// 主题状态管理
const currentTheme = ref<Theme>('system')
const isDark = ref(false)

export function useTheme() {
  // 系统主题检测
  const systemDark = ref(false)
  
  // 检查系统主题偏好
  const checkSystemTheme = () => {
    if (typeof window !== 'undefined') {
      systemDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
  }
  
  // 计算实际是否为深色模式
  const isActuallyDark = computed(() => {
    return currentTheme.value === 'dark' || 
           (currentTheme.value === 'system' && systemDark.value)
  })
  
  // 应用主题到DOM
  const applyTheme = () => {
    const root = document.documentElement
    const body = document.body
    
    if (isActuallyDark.value) {
      root.classList.add('dark')
      body.classList.add('dark')
      isDark.value = true
    } else {
      root.classList.remove('dark')
      body.classList.remove('dark')
      isDark.value = false
    }
    
    // 保存到本地存储
    localStorage.setItem('theme', currentTheme.value)
  }
  
  // 设置主题
  const setTheme = (theme: Theme) => {
    currentTheme.value = theme
  }
  
  // 切换主题
  const toggleTheme = () => {
    if (currentTheme.value === 'light') {
      setTheme('dark')
    } else if (currentTheme.value === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }
  
  // 初始化主题
  const initTheme = () => {
    // 从本地存储读取主题设置
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      currentTheme.value = savedTheme
    }
    
    checkSystemTheme()
    applyTheme()
    
    // 监听系统主题变化
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', () => {
        checkSystemTheme()
        if (currentTheme.value === 'system') {
          applyTheme()
        }
      })
    }
  }
  
  // 监听主题变化
  watch([currentTheme, systemDark], applyTheme)
  
  // 组件挂载时初始化
  onMounted(initTheme)
  
  // 主题图标
  const themeIcon = computed(() => {
    switch (currentTheme.value) {
      case 'light': return '☀️'
      case 'dark': return '🌙'
      case 'system': return '💻'
      default: return '💻'
    }
  })
  
  // 主题描述
  const themeLabel = computed(() => {
    switch (currentTheme.value) {
      case 'light': return '亮色模式'
      case 'dark': return '深色模式'
      case 'system': return '跟随系统'
      default: return '跟随系统'
    }
  })
  
  return {
    currentTheme: readonly(currentTheme),
    isDark: readonly(isDark),
    isActuallyDark,
    themeIcon,
    themeLabel,
    setTheme,
    toggleTheme,
    initTheme
  }
}

// 导出单例实例
export const themeManager = useTheme()
