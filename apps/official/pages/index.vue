<template>
  <section>
    <UContainer class="py-16">
      <div class="grid gap-8 md:grid-cols-2 md:items-center">
        <div class="space-y-6">
          <h1 class="text-3xl md:text-5xl font-bold leading-tight">
            PixelForge · AI 素材生成与批处理
          </h1>
          <p class="text-gray-600">
            面向创作者与团队的桌面应用：素材管理、风格/尺寸批量生成、任务重试与下载，一站式搞定。
          </p>
          <div class="flex items-center gap-3">
            <NuxtLink to="/download">
              <UButton size="lg">立即下载</UButton>
            </NuxtLink>
            <NuxtLink to="/pricing">
              <UButton size="lg" color="gray" variant="ghost">查看定价</UButton>
            </NuxtLink>
          </div>
        </div>
        <div class="flex justify-center md:justify-end">
          <img src="/logo.svg" alt="PixelForge" class="h-32 w-32 opacity-90" />
        </div>
      </div>
    </UContainer>
  </section>

  <section id="features" class="border-t bg-gray-50/50">
    <UContainer class="py-16">
      <h2 class="text-2xl font-semibold mb-8">核心功能</h2>
      <div class="grid gap-6 md:grid-cols-3">
        <UCard>
          <template #header>素材管理</template>
          <p class="text-gray-600">支持去重、分页与多选，批量删除与生成。</p>
        </UCard>
        <UCard>
          <template #header>批量任务</template>
          <p class="text-gray-600">按风格与纵横比为多图入队、重试与下载。</p>
        </UCard>
        <UCard>
          <template #header>本地优先</template>
          <p class="text-gray-600">Electron 应用，数据直存本机 SQLite，可靠安全。</p>
        </UCard>
      </div>
    </UContainer>
  </section>
</template>

<script setup lang="ts"></script>

