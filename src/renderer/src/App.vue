<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Images, ListChecks, Moon, Sun, Monitor, Settings, User, LogOut } from 'lucide-vue-next'
import { useTheme } from './composables/useTheme'
import { toastManager } from './composables/useToast'
import UploadsPage from './pages/uploads-page.vue'
import JobsPage from './pages/jobs-page.vue'
import SettingsPage from './pages/settings-page.vue'
import Toast from './components/ui/Toast.vue'

const tab = ref<'uploads' | 'jobs' | 'settings'>('uploads')
const { currentTheme, isDark, themeIcon, themeLabel, toggleTheme } = useTheme()

// Toast实例引用
const toastRef = ref<any>(null)

// 页面切换动画状态
const isTransitioning = ref(false)

// 切换页面with动画
const switchTab = async (newTab: 'uploads' | 'jobs' | 'settings') => {
  if (newTab === tab.value) return
  
  isTransitioning.value = true
  await new Promise(resolve => setTimeout(resolve, 150))
  tab.value = newTab
  await new Promise(resolve => setTimeout(resolve, 50))
  isTransitioning.value = false
}

// 导航菜单项
const navItems = computed(() => [
  {
    id: 'uploads',
    label: '素材管理',
    icon: Images,
    description: '上传和管理图片素材',
    active: tab.value === 'uploads'
  },
  {
    id: 'jobs',
    label: '任务中心', 
    icon: ListChecks,
    description: '查看和管理生成任务',
    active: tab.value === 'jobs'
  },
  {
    id: 'settings',
    label: '设置',
    icon: Settings,
    description: 'API Key 与服务配置',
    active: tab.value === 'settings'
  }
])

// 主题图标组件映射
const themeIconComponent = computed(() => {
  switch (currentTheme.value) {
    case 'light': return Sun
    case 'dark': return Moon
    case 'system': return Monitor
    default: return Monitor
  }
})

onMounted(() => {
  // 预加载动画
  document.body.style.opacity = '0'
  setTimeout(() => {
    document.body.style.transition = 'opacity 0.3s ease'
    document.body.style.opacity = '1'
  }, 100)
  
  // 初始化Toast管理器
  if (toastRef.value) {
    toastManager.setToastInstance(toastRef.value)
  }
})
</script>

<template>
  <div class="h-full w-full flex bg-gradient-to-br from-[hsl(var(--background))] to-[hsl(var(--muted))] animate-fade-in">
    <!-- === 现代化侧边栏 === -->
    <aside class="w-72 bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] flex flex-col shadow-elegant backdrop-blur-xl">
      <!-- 品牌区域 -->
      <div class="p-4 border-b border-[hsl(var(--border))]">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-floating">
            <span class="text-white font-bold text-lg">Q</span>
          </div>
          <div>
            <h1 class="font-bold text-lg text-[hsl(var(--foreground))] tracking-tight">
              PixelForge
            </h1>
            <p class="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
              AI图片生成管理
            </p>
          </div>
        </div>
      </div>

      <!-- 导航菜单 -->
      <nav class="flex-1 p-1 space-y-2">
        <div class="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-4">
          工作区
        </div>
        <template v-for="item in navItems" :key="item.id">
          <button
            :class="[
              'nav-item-base group relative overflow-hidden w-full',
              item.active ? 'nav-item-active' : ''
            ]"
            @click="switchTab(item.id as 'uploads' | 'jobs' | 'settings')"
            :aria-current="item.active"
          >
            <component :is="item.icon" class="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
            <div class="flex-1 text-left">
              <div class="font-medium text-sm">{{ item.label }}</div>
              <div class="text-xs text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors">
                {{ item.description }}
              </div>
            </div>
            <!-- 活跃指示器 -->
            <div v-if="item.active" class="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-l-full animate-scale-in"></div>
          </button>
        </template>
      </nav>

      <!-- 用户区域和设置 -->
      <div class="p-1 border-t border-[hsl(var(--border))] space-y-3">
        <!-- 主题切换 -->
        <button
          @click="toggleTheme"
          class="w-full nav-item-base group justify-between"
          :title="themeLabel"
        >
          <div class="flex items-center gap-3">
            <component :is="themeIconComponent" class="h-4 w-4" />
            <span class="text-sm font-medium">{{ themeLabel }}</span>
          </div>
          <div class="h-2 w-2 rounded-full bg-[hsl(var(--primary))] opacity-60 group-hover:opacity-100 transition-opacity"></div>
        </button>
        
        <!-- 用户信息 -->
        <div class="flex items-center gap-3 h-16 rounded-lg bg-[hsl(var(--muted))]/30">
          <div class="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
            <User class="h-4 w-4 text-white" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm text-[hsl(var(--foreground))] truncate">管理员</div>
            <div class="text-xs text-[hsl(var(--muted-foreground))] opacity-80">v1.0.0</div>
          </div>
        </div>
      </div>
    </aside>

    <!-- === 主内容区域 === -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- 内容转场动画容器 -->
      <div 
        :class="[
          'flex-1 transition-all duration-300 ease-in-out',
          isTransitioning ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
        ]"
      >
        <UploadsPage v-if="tab === 'uploads'" class="animate-fade-in" />
        <JobsPage v-else-if="tab === 'jobs'" class="animate-fade-in" />
        <SettingsPage v-else class="animate-fade-in" />
      </div>
    </main>

    <!-- === 全局Toast组件 === -->
    <Toast ref="toastRef" />
  </div>
</template>

<style scoped>
/* 自定义过渡效果 */
.page-transition-enter-active,
.page-transition-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-transition-enter-from {
  opacity: 0;
  transform: translateX(20px) scale(0.98);
}

.page-transition-leave-to {
  opacity: 0;
  transform: translateX(-20px) scale(0.98);
}

/* 导航项悬停效果增强 */
.nav-item-base:hover::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    hsl(var(--primary) / 0.1) 0%, 
    hsl(var(--accent) / 0.1) 100%);
  border-radius: inherit;
  z-index: -1;
  animation: fadeIn 0.2s ease;
}

/* 品牌区域渐变背景 */
.brand-gradient {
  background: linear-gradient(135deg, 
    hsl(var(--primary) / 0.05) 0%, 
    hsl(var(--accent) / 0.05) 100%);
}
</style>
