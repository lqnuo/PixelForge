<template>
  <UContainer class="py-4">
    <div class="flex items-center justify-between gap-4">
      <NuxtLink to="/" class="flex items-center gap-2 font-semibold">
        <img src="/logo.svg" alt="PixelForge" class="h-6 w-6" />
        <span>PixelForge</span>
      </NuxtLink>
      <nav class="hidden md:flex items-center gap-6 text-sm">
        <NuxtLink to="/" class="hover:opacity-80">首页</NuxtLink>
        <NuxtLink to="/pricing" class="hover:opacity-80">定价</NuxtLink>
        <NuxtLink to="/download" class="hover:opacity-80">下载</NuxtLink>
        <NuxtLink to="/#features" class="hover:opacity-80">功能</NuxtLink>
      </nav>
      <div class="flex items-center gap-2">
        <NuxtLink to="/login"><UButton color="gray" variant="ghost">登录</UButton></NuxtLink>
        <NuxtLink to="/signup"><UButton>购买会员</UButton></NuxtLink>
      </div>
    </div>
  </UContainer>
</template>

<script setup lang="ts"></script>

