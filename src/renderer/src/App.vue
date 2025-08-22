<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Images, ListChecks, Moon, Sun, Monitor, Settings } from 'lucide-vue-next'
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


// 切换页面
const switchTab = (newTab: 'uploads' | 'jobs' | 'settings') => {
  if (newTab === tab.value) return
  tab.value = newTab
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
  <div class="h-full w-full flex bg-[hsl(var(--background))] overflow-hidden">
    <!-- === 精简侧边栏 === -->
    <aside class="w-60 bg-[hsl(var(--surface-primary))] border-r border-[hsl(var(--border-subtle))] flex flex-col">
      <!-- 品牌区域重设计 -->
      <div class="p-4 border-b border-[hsl(var(--border-subtle))]">
        <div class="flex items-center gap-3">
          <div class="h-8 w-8 rounded-lg bg-[hsl(var(--primary))] flex items-center justify-center">
            <span class="text-white font-bold text-sm">P</span>
          </div>
          <div class="flex-1">
            <h1 class="font-bold text-lg text-[hsl(var(--foreground))] tracking-tight">
              PixelForge
            </h1>
          </div>
        </div>
      </div>

      <!-- 导航菜单增强 -->
      <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
        <template v-for="item in navItems" :key="item.id">
          <Button
            variant="ghost"
            :class="[
              'nav-item-base group w-full justify-start p-3',
              item.active ? 'nav-item-active' : ''
            ]"
            @click="switchTab(item.id as 'uploads' | 'jobs' | 'settings')"
            :title="item.description"
          >
            <component :is="item.icon" class="h-4 w-4 mr-3 shrink-0" />
            <span class="font-medium text-sm truncate">{{ item.label }}</span>
          </Button>
        </template>
      </nav>

      <!-- 底部区域 -->
      <div class="p-4 border-t border-[hsl(var(--border-subtle))]">
        <Button
          variant="ghost"
          @click="toggleTheme"
          class="w-full justify-start p-3"
          :title="themeLabel"
        >
          <component :is="themeIconComponent" class="h-4 w-4 mr-3" />
          <span class="text-sm font-medium">{{ themeLabel }}</span>
        </Button>
      </div>
    </aside>

    <!-- === 主内容区域 === -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <UploadsPage v-if="tab === 'uploads'" />
      <JobsPage v-else-if="tab === 'jobs'" />
      <SettingsPage v-else />
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
