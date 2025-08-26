<template>
  <header class="sticky top-0 z-30 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
    <UContainer class="flex h-14 items-center justify-between">
      <NuxtLink to="/" class="flex items-center gap-2 font-semibold">
        <img src="/icon.svg" alt="logo" class="h-6 w-6" />
        <span>PixelForge</span>
      </NuxtLink>
      <nav class="hidden items-center gap-6 sm:flex">
        <NuxtLink to="/" class="text-sm text-gray-600 hover:text-gray-900">首页</NuxtLink>
        <NuxtLink to="/#features" class="text-sm text-gray-600 hover:text-gray-900">功能</NuxtLink>
        <NuxtLink to="/#download" class="text-sm text-gray-600 hover:text-gray-900">下载</NuxtLink>
        <NuxtLink to="/login" class="text-sm text-gray-600 hover:text-gray-900">登录</NuxtLink>
      </nav>
      <div class="flex items-center gap-2">
        <UButton to="/login" color="primary" variant="solid" size="sm">登录</UButton>
        <UButton to="/#download" color="gray" variant="ghost" size="sm">下载应用</UButton>
      </div>
    </UContainer>
  </header>
</template>

<script setup lang="ts"></script>
