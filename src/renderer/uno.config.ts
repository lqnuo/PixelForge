import { defineConfig, presetWind, transformerDirectives, transformerVariantGroup } from 'unocss'

export default defineConfig({
  presets: [presetWind()],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  theme: {
    // 完美的间距系统 - 基于4px网格
    spacing: {
      'xs': '0.25rem',   // 4px
      'sm': '0.5rem',    // 8px  
      'md': '0.75rem',   // 12px
      'lg': '1rem',      // 16px
      'xl': '1.5rem',    // 24px
      '2xl': '2rem',     // 32px
      '3xl': '3rem',     // 48px
      '4xl': '4rem',     // 64px
    },
    // 高级动画时长
    duration: {
      'fast': '150ms',
      'normal': '300ms',
      'slow': '500ms',
      'ultra-slow': '1000ms',
    },
    // 专业级阴影系统
    boxShadow: {
      'elegant': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      'floating': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      'elevated': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      'dramatic': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      'glass': 'inset 0 1px 0 0 rgb(255 255 255 / 0.05)',
    },
  },
  shortcuts: [
    // === 现代化按钮系统 ===
    [
      'btn-base',
      'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    ],
    [
      'btn-primary',
      'btn-base bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-elegant hover:from-blue-700 hover:to-blue-800 hover:shadow-floating focus-visible:ring-blue-500 active:scale-[0.98]',
    ],
    [
      'btn-secondary',
      'btn-base bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] shadow-elegant hover:bg-[hsl(var(--secondary))]/80 hover:shadow-floating focus-visible:ring-[hsl(var(--ring))]',
    ],
    [
      'btn-outline',
      'btn-base border-2 border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] hover:border-[hsl(var(--accent))] focus-visible:ring-[hsl(var(--ring))]',
    ],
    [
      'btn-ghost',
      'btn-base hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] focus-visible:ring-[hsl(var(--ring))]',
    ],
    [
      'btn-danger',
      'btn-base bg-gradient-to-r from-red-600 to-red-700 text-white shadow-elegant hover:from-red-700 hover:to-red-800 hover:shadow-floating focus-visible:ring-red-500 active:scale-[0.98]',
    ],

    // === 精致卡片系统 ===
    [
      'card-base',
      'rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] shadow-elegant transition-all duration-normal',
    ],
    [
      'card-interactive',
      'card-base hover:shadow-floating hover:border-[hsl(var(--border))]/80 cursor-pointer active:scale-[0.99]',
    ],
    [
      'card-elevated',
      'card-base shadow-floating hover:shadow-elevated',
    ],
    [
      'card-glass',
      'backdrop-blur-xl bg-white/10 border border-white/20 shadow-glass text-white rounded-xl',
    ],

    // === 高级输入控件 ===
    [
      'input-base',
      'flex h-11 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm transition-all duration-fast file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[hsl(var(--muted-foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
    ],
    [
      'select-base',
      'input-base pr-10 appearance-none bg-[url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\' /%3e%3c/svg%3e")] bg-[position:right_0.75rem_center] bg-[size:1rem] bg-no-repeat',
    ],

    // === 状态标签系统 ===
    [
      'badge-base',
      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
    ],
    [
      'badge-success',
      'badge-base bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-emerald-400/30',
    ],
    [
      'badge-danger',
      'badge-base bg-red-50 text-red-700 ring-1 ring-red-600/20 dark:bg-red-400/10 dark:text-red-400 dark:ring-red-400/30',
    ],
    [
      'badge-warning',
      'badge-base bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-400 dark:ring-amber-400/30',
    ],
    [
      'badge-info',
      'badge-base bg-blue-50 text-blue-700 ring-1 ring-blue-600/20 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30',
    ],
    [
      'badge-neutral',
      'badge-base bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] ring-1 ring-[hsl(var(--border))]',
    ],

    // === 导航组件 ===
    [
      'nav-item-base',
      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-normal hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]',
    ],
    [
      'nav-item-active',
      'nav-item-base bg-gradient-to-r from-[hsl(var(--primary))]/10 to-[hsl(var(--primary))]/5 text-[hsl(var(--primary))] border-r-2 border-[hsl(var(--primary))] shadow-elegant',
    ],

    // === 布局工具 ===
    [
      'toolbar-modern',
      'sticky top-0 z-10 flex items-center justify-between gap-4 bg-[hsl(var(--background))]/95 backdrop-blur-sm px-6 py-4 border-b border-[hsl(var(--border))]',
    ],
    [
      'container-fluid',
      'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8',
    ],
    [
      'glass-panel',
      'backdrop-blur-xl bg-[hsl(var(--background))]/80 border border-[hsl(var(--border))]/50 shadow-glass',
    ],

    // === 动画效果 ===
    [
      'animate-in',
      'animate-in fade-in-0 zoom-in-95 duration-fast',
    ],
    [
      'animate-out',
      'animate-out fade-out-0 zoom-out-95 duration-fast',
    ],
    [
      'slide-in-from-bottom',
      'animate-in slide-in-from-bottom-4 duration-normal',
    ],
    [
      'slide-in-from-top',
      'animate-in slide-in-from-top-4 duration-normal',
    ],
    [
      'pulse-gentle',
      'animate-pulse animation-duration-slow',
    ],

    // === 拖拽区域 ===
    [
      'dropzone-idle',
      'border-2 border-dashed border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--muted))]/20 transition-all duration-normal',
    ],
    [
      'dropzone-active',
      'border-2 border-dashed border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 shadow-dramatic scale-[1.02] transition-all duration-normal',
    ],

    // === 加载状态 ===
    [
      'spinner',
      'animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full',
    ],
    [
      'skeleton',
      'animate-pulse bg-[hsl(var(--muted))] rounded-md',
    ],

    // === 响应式网格 ===
    [
      'grid-responsive',
      'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
    ],
    [
      'grid-auto-fill',
      'grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6',
    ],
  ],
  rules: [
    // 自定义规则：完美的间距控制
    [/^m-([\d.]+)$/, ([, d]) => ({ margin: `${d}rem` })],
    [/^p-([\d.]+)$/, ([, d]) => ({ padding: `${d}rem` })],
    // 高级渐变背景
    ['bg-gradient-primary', {
      'background': 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary))/80 100%)'
    }],
    ['bg-gradient-glass', {
      'background': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
    }],
  ],
})
