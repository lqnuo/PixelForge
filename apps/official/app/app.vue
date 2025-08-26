<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <SiteHeader />
    <main class="py-10">
      <UContainer>
        <NuxtPage />
      </UContainer>
    </main>
    <footer class="border-t py-6 text-center text-sm text-gray-500">
      <UContainer>
        © {{ new Date().getFullYear() }} PixelForge · Built with Electron + Vue 3
      </UContainer>
    </footer>
  </UApp>
</template>

<script setup lang="ts">
import SiteHeader from '../components/SiteHeader.vue'
</script>
