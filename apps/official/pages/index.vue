<template>
  <div class="space-y-16">
    <section class="text-center py-8">
      <h1 class="text-4xl font-bold tracking-tight">Electron · Vue 3 · Tailwind v4</h1>
      <p class="mt-4 text-gray-600 max-w-2xl mx-auto">
        PixelForge 是一个基于 Electron 的桌面应用，提供素材管理与批量生成任务能力。
        前端使用 Vue 3 + TypeScript，样式采用 Tailwind CSS v4，UI 组件基于 shadcn-vue。
      </p>
      <div class="mt-6 flex items-center justify-center gap-3">
        <UButton to="#download" color="primary" size="md">下载应用</UButton>
        <UButton to="/login" variant="outline" size="md">登录账号</UButton>
      </div>
    </section>

    <section id="features" class="grid gap-6 sm:grid-cols-2">
      <UCard>
        <template #header>
          <div class="font-semibold">素材管理</div>
        </template>
        <p class="text-gray-600">支持上传、分组、预览与批量操作。</p>
      </UCard>
      <UCard>
        <template #header>
          <div class="font-semibold">任务队列</div>
        </template>
        <p class="text-gray-600">后台处理、状态跟踪、失败重试与结果下载。</p>
      </UCard>
      <UCard>
        <template #header>
          <div class="font-semibold">IPC 接口</div>
        </template>
        <p class="text-gray-600">安全的 preload 桥接，仅通过 window.api 访问。</p>
      </UCard>
      <UCard>
        <template #header>
          <div class="font-semibold">跨平台构建</div>
        </template>
        <p class="text-gray-600">Electron Builder 支持 macOS / Windows / Linux。</p>
      </UCard>
    </section>

    <section id="download" class="text-center">
      <UAlert title="下载渠道" :ui="{ base: 'text-left sm:text-center' }">
        <template #description>
          <div class="space-y-2">
            <p>请前往 GitHub Releases 或应用内更新通道获取最新版本。</p>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
              <UButton color="gray" variant="soft" to="https://github.com/" target="_blank">GitHub Releases</UButton>
              <UButton color="gray" variant="soft" to="/login">绑定账号后启用云服务</UButton>
            </div>
          </div>
        </template>
      </UAlert>
    </section>
  </div>
</template>

<script setup lang="ts"></script>
