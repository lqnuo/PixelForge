<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import ImageList from './components/image-list.vue'
import ConfigPanel from './components/config-panel.vue'
import ResultsList from './components/results-list.vue'
import type { ImageItem, StyleItem } from './types'

const images = ref<ImageItem[]>([])
const styles = ref<StyleItem[]>([])
const selectedImageId = ref<string | null>(null)
const selectedStyleId = ref<string | null>(null)
const aspect = ref<'1:1' | '3:4'>('1:1')
const results = ref<any[]>([])
const jobs = ref<any[]>([])
const lastError = ref<string | null>(null)
const isGenerating = ref(false)

const bridge: any = (window as any)?.api

onMounted(async () => {
  if (!bridge) {
    lastError.value = '预加载桥接未就绪（window.api 不可用），请检查 sandbox 设置与 preload 加载路径'
    return
  }
  images.value = await bridge.image.list()
  styles.value = await bridge.style.list()

  const offResult = bridge?.events?.onResultCreated?.(async (p: any) => {
    if (selectedImageId.value && p?.sourceImageId === selectedImageId.value) {
      results.value = await bridge.result.listByImage(selectedImageId.value)
    }
  })
  const offJob = bridge?.events?.onJobUpdated?.(async (_p: any) => {
    if (selectedImageId.value) {
      results.value = await bridge.result.listByImage(selectedImageId.value)
      const js = await bridge.job.listByImage(selectedImageId.value)
      jobs.value = js
      const failed = js.find((j: any) => j.status === 'failed')
      lastError.value = failed?.error || null
    }
  })

  onUnmounted(() => {
    try { offResult && offResult() } catch {}
    try { offJob && offJob() } catch {}
  })
})

watch(selectedImageId, async (id) => {
  if (!id || !bridge) return
  results.value = await bridge.result.listByImage(id)
  const js = await bridge.job.listByImage(id)
  jobs.value = js
  const failed = js.find((j: any) => j.status === 'failed')
  lastError.value = failed?.error || null
})

const selectedImage = computed(() => images.value.find((i) => i.id === selectedImageId.value) || null)

async function uploadFiles(files: File[]) {
  const items: any[] = []
  for (const f of files) {
    const arr = await f.arrayBuffer()
    const base64 = Buffer.from(arr).toString('base64')
    const preview = await resizePreview(f, 320)
    items.push({
      filename: f.name,
      mimeType: f.type || 'image/png',
      sizeBytes: f.size,
      dataBase64: base64,
      previewBase64: preview,
    })
  }
  if (!bridge) return
  const res = await bridge.image.upload(items)
  images.value = await bridge.image.list()
  if (res?.[0]?.id) selectedImageId.value = res[0].id
}

async function handleGenerate() {
  if (!selectedImageId.value || !bridge) return
  isGenerating.value = true
  await bridge.job.create({ imageId: selectedImageId.value, styleId: selectedStyleId.value, aspectRatio: aspect.value })
  setTimeout(async () => {
    results.value = await bridge.result.listByImage(selectedImageId.value!)
    isGenerating.value = false
  }, 400)
}

async function deleteSelected() {
  if (!selectedImageId.value || !bridge) return
  if (!confirm('确定删除该图片及其关联任务与结果？')) return
  const res = await bridge.image.delete(selectedImageId.value)
  if (res?.ok) {
    const list = await bridge.image.list()
    images.value = list
    selectedImageId.value = list[0]?.id || null
    results.value = []
    jobs.value = []
    lastError.value = null
  }
}

function openDownloadsDir() {
  bridge?.file.openDownloadsDir()
}

function onReorder(v: ImageItem[]) {
  images.value = v
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

// keyboard shortcuts
const onKey = (e: KeyboardEvent) => {
  if (selectedImageId.value && (e.key.toLowerCase() === 'r' || e.key === 'Enter')) {
    e.preventDefault()
    handleGenerate()
    return
  }
  if (selectedImageId.value && (e.key === 'Delete' || e.key === 'Backspace')) {
    e.preventDefault()
    deleteSelected()
    return
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
    e.preventDefault()
    openDownloadsDir()
    return
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="h-full w-full grid grid-cols-12">
    <ImageList
      :images="images"
      :selectedImageId="selectedImageId"
      @update:images="onReorder"
      @select="(id) => (selectedImageId = id)"
      @deleteSelected="deleteSelected"
      @uploadFiles="uploadFiles"
    />

    <ConfigPanel
      :styles="styles"
      :selectedStyleId="selectedStyleId"
      :aspect="aspect"
      :isGenerating="!selectedImageId || isGenerating"
      :lastError="lastError"
      :jobs="jobs"
      @update:selectedStyleId="(v) => (selectedStyleId = v)"
      @update:aspect="(v) => (aspect = v)"
      @generate="handleGenerate"
      @retryJob="async (id) => { await bridge?.job.retry(id); lastError.value = null }"
    />

    <ResultsList
      :results="results"
      :selectedImage="selectedImage"
      @download="(id, name) => bridge?.file.download(id, name)"
      @openDownloadsDir="openDownloadsDir"
    />
  </div>
</template>

<style scoped></style>
