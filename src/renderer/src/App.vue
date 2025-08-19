<script setup lang="ts">
import { ref } from 'vue'
import { Images, ListChecks } from 'lucide-vue-next'
import UploadsPage from './pages/uploads-page.vue'
import JobsPage from './pages/jobs-page.vue'

const tab = ref<'uploads' | 'jobs'>('uploads')
</script>

<template>
  <div class="h-full w-full flex">
    <!-- Left Sidebar -->
    <aside class="w-60 border-r h-full flex flex-col">
      <div class="p-4 border-b">
        <div class="text-sm font-semibold">Qwan Image Admin</div>
      </div>
      <nav class="p-2 space-y-1">
        <button class="nav-item" :class="tab==='uploads' ? 'nav-item-active' : ''" @click="tab='uploads'" :aria-current="tab==='uploads'">
          <Images class="w-4 h-4" />
          <span class="truncate">素材</span>
        </button>
        <button class="nav-item" :class="tab==='jobs' ? 'nav-item-active' : ''" @click="tab='jobs'" :aria-current="tab==='jobs'">
          <ListChecks class="w-4 h-4" />
          <span class="truncate">任务</span>
        </button>
      </nav>
      <div class="mt-auto p-3 border-t text-xs text-neutral-500">v1.0.0</div>
    </aside>

    <!-- Right Content -->
    <main class="flex-1 overflow-hidden">
      <UploadsPage v-if="tab === 'uploads'" />
      <JobsPage v-else />
    </main>
  </div>
  
</template>

<style scoped></style>
