<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Images, ListChecks, Moon, Sun, Monitor, Settings, User, LogOut } from 'lucide-vue-next'
import { useTheme } from './composables/useTheme'
import { Toaster } from '@/components/ui/sonner'
import 'vue-sonner/style.css'
import UploadsPage from './pages/uploads-page.vue'
import JobsPage from './pages/jobs-page.vue'
import SettingsPage from './pages/settings-page.vue'
// Removed custom Toast in favor of vue-sonner Toaster
import { Button } from '@/components/ui/button'

const tab = ref<'uploads' | 'jobs' | 'settings'>('uploads')
const { currentTheme, isDark, themeIcon, themeLabel, toggleTheme } = useTheme()


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
})
</script>

<template>
  <div class="h-full w-full flex bg-[hsl(var(--background))] animate-fade-in overflow-hidden">
    <!-- === 精简侧边栏 === -->
    <aside class="w-80 bg-[hsl(var(--surface-primary))] border-r border-[hsl(var(--border-subtle))] flex flex-col shadow-elevated backdrop-blur-xl">
      <!-- 品牌区域重设计 -->
      <div class="p-6 border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--primary))]/5">
        <div class="flex items-center gap-4">
          <div class="relative">
            <div class="h-12 w-12 rounded-2xl bg-[hsl(var(--primary))] flex items-center justify-center shadow-floating animate-glow">
              <span class="text-white font-bold text-xl tracking-tight">P</span>
            </div>
            <div class="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-[hsl(var(--surface-primary))] animate-bounce-subtle"></div>
          </div>
          <div class="flex-1">
            <h1 class="font-bold text-xl text-[hsl(var(--foreground))] tracking-tight text-gradient">
              PixelForge
            </h1>
            <p class="text-sm text-[hsl(var(--text-tertiary))] mt-1 font-medium">
              AI 创意工作台
            </p>
          </div>
        </div>
      </div>

      <!-- 导航菜单增强 -->
      <nav class="flex-1 p-6 space-y-3 overflow-y-auto">
        <div class="flex items-center gap-2 mb-6">
          <div class="h-1 w-8 bg-[hsl(var(--primary))] rounded-full"></div>
          <div class="text-xs font-bold text-[hsl(var(--text-tertiary))] uppercase tracking-[0.1em]">
            创作空间
          </div>
        </div>
        <template v-for="item in navItems" :key="item.id">
          <Button
            variant="ghost"
            :class="[
              'nav-item-base group relative overflow-hidden w-full justify-start border border-transparent',
              item.active ? 'nav-item-active' : 'hover:border-[hsl(var(--border-subtle))]'
            ]"
            @click="switchTab(item.id as 'uploads' | 'jobs' | 'settings')"
            :aria-current="item.active"
          >
            <div class="relative z-10 flex items-center gap-4 w-full">
              <div class="relative">
                <component :is="item.icon" class="h-5 w-5 shrink-0 transition-all duration-300 group-hover:scale-110" />
                <div v-if="item.active" class="absolute inset-0 h-5 w-5 bg-[hsl(var(--primary))] rounded-full opacity-20 animate-pulse"></div>
              </div>
              <div class="flex-1 text-left min-w-0">
                <div class="font-semibold text-sm truncate">{{ item.label }}</div>
                <div class="text-xs opacity-70 transition-opacity group-hover:opacity-100 truncate">
                  {{ item.description }}
                </div>
              </div>
            </div>
          </Button>
        </template>
        
        <!-- 快速操作区域 -->
        <div class="mt-8 pt-6 border-t border-[hsl(var(--border-subtle))]">
          <div class="text-xs font-bold text-[hsl(var(--text-tertiary))] uppercase tracking-[0.1em] mb-4">
            快速操作
          </div>
          <div class="space-y-2">
            <Button variant="ghost" class="w-full justify-start text-sm text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]">
              <component :is="Images" class="h-4 w-4 mr-3" />
              批量导入
            </Button>
            <Button variant="ghost" class="w-full justify-start text-sm text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]">
              <component :is="Settings" class="h-4 w-4 mr-3" />
              API 配置
            </Button>
          </div>
        </div>
      </nav>

      <!-- 优雅的底部区域 -->
      <div class="p-6 border-t border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface-secondary))]/30 space-y-4">
        <!-- 主题切换重设计 -->
        <Button
          variant="ghost"
          @click="toggleTheme"
          class="w-full nav-item-base group justify-between border border-[hsl(var(--border-subtle))] hover:border-[hsl(var(--primary))]/30"
          :title="themeLabel"
        >
          <div class="flex items-center gap-3">
            <div class="relative">
              <component :is="themeIconComponent" class="h-5 w-5 transition-transform group-hover:rotate-12" />
              <div class="absolute inset-0 h-5 w-5 bg-[hsl(var(--accent))] rounded-full opacity-0 group-hover:opacity-20 transition-opacity animate-pulse"></div>
            </div>
            <span class="text-sm font-semibold">{{ themeLabel }}</span>
          </div>
          <div class="h-2 w-2 rounded-full bg-[hsl(var(--primary))] opacity-60 group-hover:opacity-100 transition-all animate-pulse"></div>
        </Button>
        
        <!-- 用户信息卡片重设计 -->
        <div class="card-elevated p-4 bg-[hsl(var(--surface-primary))] border border-[hsl(var(--border-subtle))]">
          <div class="flex items-center gap-3">
            <div class="relative">
              <div class="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-floating">
                <User class="h-5 w-5 text-white" />
              </div>
              <div class="absolute -top-1 -right-1 h-3 w-3 bg-emerald-400 rounded-full border border-[hsl(var(--surface-primary))] animate-pulse"></div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-sm text-[hsl(var(--text-primary))] truncate">AI 创作师</div>
              <div class="text-xs text-[hsl(var(--text-tertiary))] flex items-center gap-2">
                <span>v1.0.0</span>
                <span class="h-1 w-1 bg-[hsl(var(--text-tertiary))] rounded-full"></span>
                <span class="text-emerald-500 font-medium">在线</span>
              </div>
            </div>
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

    <!-- === Global Toaster (shadcn-vue Sonner) === -->
    <Toaster position="top-right" rich-colors />
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
  background: hsl(var(--primary) / 0.08);
  border-radius: inherit;
  z-index: -1;
  animation: fadeIn 0.2s ease;
}

/* 品牌区域扁平背景（无渐变） */
.brand-gradient {
  background-color: hsl(var(--primary) / 0.05);
}
</style>
