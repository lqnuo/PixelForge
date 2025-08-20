<script setup lang="ts">
import type { StyleItem } from '@/types'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  styles: StyleItem[]
  selectedStyleId: string | null
  aspect: '1:1' | '3:4'
  isGenerating: boolean
  lastError: string | null
  jobs: any[]
}>()

const emit = defineEmits<{
  (e: 'update:selectedStyleId', id: string | null): void
  (e: 'update:aspect', value: '1:1' | '3:4'): void
  (e: 'generate'): void
  (e: 'retryJob', id: string): void
}>()
</script>

<template>
  <div class="col-span-4 border-r h-full flex flex-col">
    <div class="sticky top-0 z-10 bg-[hsl(var(--background))] border-b p-4 font-semibold">配置</div>
    <div class="p-4 space-y-4 overflow-auto flex-1">
    <div v-if="lastError" class="p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
      出错了：{{ lastError }}
      <Button
        v-for="j in jobs.filter((j:any) => j.status === 'failed').slice(0,1)"
        :key="j.id"
        variant="destructive"
        class="ml-3 px-2 py-1 text-xs rounded border border-red-300 hover:bg-red-100"
        @click="emit('retryJob', j.id)"
      >重试</Button>
    </div>
    <div>
      <div class="text-sm mb-2">风格预设</div>
      <div class="flex flex-wrap gap-2">
        <Button
          v-for="s in styles"
          :key="s.id"
          :variant="selectedStyleId === s.id ? 'default' : 'outline'"
          @click="emit('update:selectedStyleId', s.id)"
        >{{ s.name }}</Button>
      </div>
    </div>
    <div>
      <div class="text-sm mb-2">尺寸比例</div>
      <div class="flex gap-2">
        <Button
          v-for="a in ['1:1','3:4']"
          :key="a"
          :variant="aspect === a ? 'default' : 'outline'"
          @click="emit('update:aspect', a as any)"
        >{{ a }}</Button>
      </div>
    </div>
    </div>
    <div class="p-4 border-t">
      <Button class="w-full" :disabled="isGenerating" @click="emit('generate')">
        <span v-if="isGenerating" class="inline-block h-3 w-3 mr-2 align-[-2px] border-2 border-current border-t-transparent rounded-full animate-spin"></span>
        {{ isGenerating ? '生成中…' : '开始生成' }}
      </Button>
    </div>
  </div>
</template>

<style scoped></style>
