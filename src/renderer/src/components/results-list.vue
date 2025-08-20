<script setup lang="ts">
import type { ImageItem } from '@/types'
import { Download } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  results: any[]
  selectedImage: ImageItem | null
}>()

const emit = defineEmits<{
  (e: 'download', resultId: string, suggestedName?: string): void
  (e: 'openDownloadsDir'): void
}>()

function dataUrl(mime: string, base64?: string | null) {
  if (!base64) return ''
  return `data:${mime};base64,${base64}`
}
</script>

<template>
  <div class="col-span-5 h-full flex flex-col">
    <div class="sticky top-0 z-10 bg-[hsl(var(--background))] border-b p-4 font-semibold flex items-center justify-between">
      <span>结果预览</span>
      <Button variant="outline" class="!px-2 !py-1 text-xs" @click="emit('openDownloadsDir')">打开下载目录</Button>
    </div>
    <div class="space-y-3 overflow-auto p-4 flex-1">
      <div v-for="r in results" :key="r.id" class="card">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <div class="text-xs text-neutral-500 mb-1">原图</div>
            <img v-if="selectedImage" :src="dataUrl(selectedImage!.mimeType, selectedImage!.previewBase64)" class="w-full object-contain rounded" />
          </div>
          <div>
            <div class="text-xs text-neutral-500 mb-1">效果图</div>
            <img :src="dataUrl(r.mimeType, r.previewBase64)" class="w-full object-contain rounded" />
          </div>
        </div>
        <div class="mt-2">
          <Button variant="outline" @click="emit('download', r.id, `${selectedImage?.filename || r.id}`)">
            <Download class="w-4 h-4 mr-1" /> 下载
          </Button>
        </div>
      </div>
      <div v-if="selectedImage && results.length === 0" class="text-sm text-neutral-500">无生成结果，请点击“开始生成”</div>
      <div v-if="!selectedImage" class="text-sm text-neutral-500">请选择一张图片</div>
    </div>
  </div>
</template>

<style scoped></style>
