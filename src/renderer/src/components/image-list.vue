<script setup lang="ts">
import { ref, watch } from 'vue'
import { GripVertical } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { VueDraggableNext as Draggable } from 'vue-draggable-next'
import type { ImageItem } from '@/types'

const props = defineProps<{
  images: ImageItem[]
  selectedImageId: string | null
}>()

const emit = defineEmits<{
  (e: 'update:images', value: ImageItem[]): void
  (e: 'select', id: string): void
  (e: 'deleteSelected'): void
  (e: 'uploadFiles', files: File[]): void
}>()

const isDragging = ref(false)
const list = ref<ImageItem[]>([...props.images])

watch(
  () => props.images,
  (val) => {
    list.value = [...val]
  },
  { deep: true }
)

watch(
  list,
  (val) => {
    emit('update:images', val)
  },
  { deep: true }
)

function dataUrl(mime: string, base64?: string | null) {
  if (!base64) return ''
  return `data:${mime};base64,${base64}`
}

function onDropFiles(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const files = Array.from(e.dataTransfer?.files || []).filter((f) => f.type.startsWith('image/'))
  if (files.length) emit('uploadFiles', files)
}

async function onInputChange(evt: Event) {
  const input = evt.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return
  emit('uploadFiles', Array.from(files))
  input.value = ''
}
</script>

<template>
  <div
    class="col-span-3 border-r h-full flex flex-col"
    :class="{ 'bg-[hsl(var(--muted))] ring-2 ring-[hsl(var(--ring))]': isDragging }"
    @dragover.prevent="isDragging = true"
    @dragenter.prevent="isDragging = true"
    @dragleave="isDragging = false"
    @drop="onDropFiles"
  >
    <div class="sticky top-0 z-10 bg-[hsl(var(--background))] border-b p-3 flex items-center justify-between">
      <div class="font-semibold">待处理</div>
      <label class="cursor-pointer">
        <Button class="pointer-events-none">上传</Button>
        <input type="file" multiple accept="image/*" class="hidden" @change="onInputChange" />
      </label>
    </div>

    <Draggable
      v-model="list"
      item-key="id"
      handle=".drag-handle"
      animation="200"
      class="space-y-2 overflow-auto p-3 flex-1"
    >
      <template #item="{ element }">
        <button
          @click="emit('select', element.id)"
          class="w-full flex items-center gap-2 rounded-md p-2 border hover:bg-[hsl(var(--muted))] transition-colors"
          :class="{ 'ring-2 ring-[hsl(var(--ring))]': selectedImageId === element.id }"
        >
          <GripVertical class="w-4 h-4 text-neutral-400 drag-handle" />
          <img :src="dataUrl(element.mimeType, element.previewBase64)" class="h-12 w-12 object-cover rounded" />
          <div class="text-left">
            <div class="text-sm font-medium line-clamp-1">{{ element.filename || element.id }}</div>
            <div class="text-xs text-neutral-500">{{ (element.sizeBytes / 1024).toFixed(0) }} KB</div>
          </div>
        </button>
      </template>
    </Draggable>

    <div v-if="list.length === 0" class="text-sm text-neutral-500 p-3">请先上传图片（支持拖拽）</div>

    <div class="p-3 border-t">
      <Button variant="outline" class="w-full" :disabled="!selectedImageId" @click="emit('deleteSelected')">删除所选</Button>
    </div>
  </div>
</template>

<style scoped></style>
