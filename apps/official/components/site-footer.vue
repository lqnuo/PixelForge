<template>
  <footer class="border-t">
    <UContainer class="py-10 text-sm">
      <div class="flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <img src="/logo.svg" alt="PixelForge" class="h-5 w-5" />
          <span class="font-medium">PixelForge</span>
          <span class="text-gray-500">© {{ new Date().getFullYear() }}</span>
        </div>
        <div class="flex items-center gap-6">
          <NuxtLink to="/privacy" class="text-gray-500 hover:text-gray-700">隐私</NuxtLink>
          <NuxtLink to="/terms" class="text-gray-500 hover:text-gray-700">条款</NuxtLink>
          <a href="mailto:support@pixelforge.app" class="text-gray-500 hover:text-gray-700">支持</a>
          <a href="https://x.com" target="_blank" class="text-gray-500 hover:text-gray-700">X</a>
        </div>
      </div>
    </UContainer>
  </footer>
</template>

<script setup lang="ts"></script>

