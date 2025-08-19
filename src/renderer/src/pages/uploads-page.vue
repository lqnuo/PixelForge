<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import type { ImageItem, StyleItem } from '@/types'

const bridge: any = (window as any)?.api

const images = ref<ImageItem[]>([])
const styles = ref<StyleItem[]>([])
const selected = ref<Set<string>>(new Set())
const page = ref(1)
const pageSize = ref(20)
const aspect = ref<'1:1' | '3:4'>('1:1')
const selectedStyleId = ref<string | null>(null)
const isGenerating = ref(false)
const isDragging = ref(false)

const total = computed(() => images.value.length)
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const pageItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return images.value.slice(start, start + pageSize.value)
})

onMounted(async () => {
  if (!bridge) return
  images.value = await bridge.image.list()
  styles.value = await bridge.style.list()
})

function toggleAllOnPage(checked: boolean) {
  for (const it of pageItems.value) {
    if (checked) selected.value.add(it.id)
    else selected.value.delete(it.id)
  }
}

function isChecked(id: string) {
  return selected.value.has(id)
}

function toggle(id: string, checked: boolean) {
  if (checked) selected.value.add(id)
  else selected.value.delete(id)
}

function onDropFiles(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const files = Array.from(e.dataTransfer?.files || []).filter((f) => f.type.startsWith('image/'))
  if (files.length) uploadFiles(files)
}

async function onInputChange(evt: Event) {
  const input = evt.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return
  await uploadFiles(Array.from(files))
  input.value = ''
}

async function uploadFiles(files: File[]) {
  const items: any[] = []
  for (const f of files) {
    const arr = await f.arrayBuffer()
    const base64 = Buffer.from(arr).toString('base64')
    const preview = await resizePreview(f, 320)
    items.push({ filename: f.name, mimeType: f.type || 'image/png', sizeBytes: f.size, dataBase64: base64, previewBase64: preview })
  }
  await bridge.image.upload(items)
  images.value = await bridge.image.list()
}

async function generateSelected() {
  if (selected.value.size === 0) return
  if (!selectedStyleId.value) {
    alert('请先选择风格')
    return
  }
  isGenerating.value = true
  const ids = Array.from(selected.value)
  await bridge.job.bulkCreate({ imageIds: ids, styleId: selectedStyleId.value, aspectRatio: aspect.value })
  isGenerating.value = false
}

async function deleteSelected() {
  if (selected.value.size === 0) return
  if (!confirm(`确定删除选中的 ${selected.value.size} 张图片及其关联任务与结果？`)) return
  for (const id of Array.from(selected.value)) {
    await bridge.image.delete(id)
  }
  selected.value.clear()
  images.value = await bridge.image.list()
}

async function resizePreview(file: File, maxWidth: number): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const scale = Math.min(1, maxWidth / (img.width || 1))
    const w = Math.max(1, Math.round((img.width || maxWidth) * scale))
    const h = Math.max(1, Math.round((img.height || maxWidth) * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, w, h)
    const dataUrl = canvas.toDataURL(file.type || 'image/png', 0.8)
    return dataUrl.split(',')[1] || ''
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
    img.src = url
  })
}

function dataUrl(mime: string, base64?: string | null) {
  if (!base64) return ''
  return `data:${mime};base64,${base64}`
}
</script>

<template>
  <div
    class="h-full flex flex-col"
    :class="{ 'bg-[hsl(var(--muted))] ring-2 ring-[hsl(var(--ring))]': isDragging }"
    @dragover.prevent="isDragging = true"
    @dragenter.prevent="isDragging = true"
    @dragleave="isDragging = false"
    @drop="onDropFiles"
  >
    <div class="toolbar grid grid-cols-2">
      <div class="flex items-center gap-2">
        <label class="cursor-pointer">
          <button class="btn btn-primary pointer-events-none">上传</button>
          <input type="file" multiple accept="image/*" class="hidden" @change="onInputChange" />
        </label>
        <button class="btn btn-outline" :disabled="selected.size===0" @click="deleteSelected">删除所选</button>
      </div>
      <div class="flex items-center justify-end gap-2">
        <select v-model="selectedStyleId" class="select min-w-36">
          <option :value="null">选择风格…</option>
          <option v-for="s in styles" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <select v-model="aspect" class="select min-w-24">
          <option value="1:1">1:1</option>
          <option value="3:4">3:4</option>
        </select>
        <button class="btn btn-primary" :disabled="isGenerating || selected.size===0 || !selectedStyleId" @click="generateSelected">
          <span v-if="isGenerating" class="inline-block h-3 w-3 mr-2 align-[-2px] border-2 border-current border-t-transparent rounded-full animate-spin"></span>
          批量生成
        </button>
      </div>
    </div>

    <div class="p-3 border-b text-sm text-neutral-500 flex items-center justify-between bg-[hsl(var(--background))]">
      <div>共 {{ total }} 项</div>
      <div class="flex items-center gap-2">
        <label class="flex items-center gap-1"><input type="checkbox" @change="(e:any)=>toggleAllOnPage(e.target.checked)" />本页全选</label>
        <select v-model.number="pageSize" class="select">
          <option :value="10">10/页</option>
          <option :value="20">20/页</option>
          <option :value="50">50/页</option>
        </select>
        <div class="flex items-center gap-1">
          <button class="btn btn-outline !px-2" :disabled="page<=1" @click="page=Math.max(1,page-1)">上一页</button>
          <span>第 {{ page }} / {{ pageCount }} 页</span>
          <button class="btn btn-outline !px-2" :disabled="page>=pageCount" @click="page=Math.min(pageCount,page+1)">下一页</button>
        </div>
      </div>
    </div>

    <div class="p-3 flex-1 overflow-auto grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
      <label v-for="it in pageItems" :key="it.id" class="card cursor-pointer select-none hover:shadow transition-shadow">
        <div class="flex items-center gap-2 mb-2">
          <input type="checkbox" :checked="isChecked(it.id)" @change="(e:any)=>toggle(it.id,e.target.checked)" />
          <div class="text-sm font-medium line-clamp-1">{{ it.filename || it.id }}</div>
        </div>
        <img :src="dataUrl(it.mimeType, it.previewBase64)" class="w-full aspect-square object-cover rounded-md" />
        <div class="text-xs text-neutral-500 mt-2">{{ (it.sizeBytes/1024).toFixed(0) }} KB</div>
      </label>
      <div v-if="pageItems.length===0" class="text-sm text-neutral-500">暂无素材，请上传。</div>
    </div>
  </div>
</template>

<style scoped></style>
