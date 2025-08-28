<template>
  <section>
    <UContainer class="py-12 md:py-20">
      <div class="grid md:grid-cols-2 gap-10 items-center">
        <div class="space-y-6">
          <UBadge color="primary" variant="subtle">全新</UBadge>
          <h1 class="text-3xl md:text-5xl font-bold leading-tight">
            PixelForge — 桌面 AI 图像生产力
          </h1>
          <p class="text-gray-500 md:text-lg">
            以素材为中心，批量生成风格化图像与指定尺寸导出。内置任务队列、历史记录与下载管理，离线可用。
          </p>
          <div class="flex flex-wrap gap-3">
            <NuxtLink to="/signup"><UButton size="lg">立即购买会员</UButton></NuxtLink>
            <NuxtLink to="/download"><UButton size="lg" variant="ghost">下载应用</UButton></NuxtLink>
          </div>
          <div class="flex items-center gap-6 text-gray-500 text-sm">
            <div>适配 macOS / Windows / Linux</div>
            <div>本地数据库 · 隐私可控</div>
          </div>
        </div>
        <div>
          <UCard>
            <div class="aspect-video bg-[var(--ui-bg-elevated)] rounded-md flex items-center justify-center text-gray-400">
              产品预览占位图
            </div>
          </UCard>
        </div>
      </div>
    </UContainer>
  </section>

  <section id="features" class="border-t">
    <UContainer class="py-12 md:py-20">
      <h2 class="text-2xl md:text-3xl font-bold mb-8">核心功能</h2>
      <div class="grid md:grid-cols-3 gap-6">
        <UCard>
          <h3 class="font-semibold mb-2">素材管理</h3>
          <p class="text-gray-500">网格列表 · 批量选择 · 标签分类</p>
        </UCard>
        <UCard>
          <h3 class="font-semibold mb-2">任务队列</h3>
          <p class="text-gray-500">并发执行 · 状态筛选 · 批量重试</p>
        </UCard>
        <UCard>
          <h3 class="font-semibold mb-2">风格与尺寸</h3>
          <p class="text-gray-500">一键套用预设 · 自定义比例与导出</p>
        </UCard>
      </div>
    </UContainer>
  </section>

  <section class="border-t bg-[var(--ui-bg-elevated)]">
    <UContainer class="py-12 md:py-20">
      <div class="grid md:grid-cols-2 gap-6 items-center">
        <div class="space-y-3">
          <h3 class="text-xl md:text-2xl font-semibold">为创作流程而生</h3>
          <p class="text-gray-500">极简交互、清晰分区、状态清晰的任务列表，适合设计师与运营同学的日常批量工作。</p>
        </div>
        <UCard>
          <div class="aspect-[4/3] rounded-md bg-white/5 flex items中心 justify-center text-gray-400">
            界面片段占位图
          </div>
        </UCard>
      </div>
    </UContainer>
  </section>

  <section class="border-t">
    <UContainer class="py-12 md:py-20 text-center">
      <h3 class="text-2xl font-bold mb-4">立即开始</h3>
      <p class="text-gray-500 mb-6">下载应用并登录账号，解锁会员功能。</p>
      <div class="flex justify-center gap-3">
        <NuxtLink to="/download"><UButton size="lg">下载</UButton></NuxtLink>
        <NuxtLink to="/pricing"><UButton size="lg" variant="ghost">查看定价</UButton></NuxtLink>
      </div>
    </UContainer>
  </section>
</template>

<script setup lang="ts"></script>

