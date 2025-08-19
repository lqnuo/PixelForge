<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, computed, watch } from 'vue'
import { Download, Trash2 } from 'lucide-vue-next'

type ImageItem = {
  id: string
  filename: string | null
  mimeType: string
  sizeBytes: number
  width?: number | null
  height?: number | null
  sha256: string
  previewBase64?: string | null
  createdAt: number
}

type StyleItem = { id: string; name: string; description?: string | null }

function dataUrl(mime: string, base64?: string | null) {
  if (!base64) return ''
  return `data:${mime};base64,${base64}`
}

const images = ref<ImageItem[]>([])
const styles = ref<StyleItem[]>([])
const selectedImageId = ref<string | null>(null)
const selectedStyleId = ref<string | null>(null)
const aspect = ref<'1:1' | '3:4'>('1:1')
const results = ref<any[]>([])
const jobs = ref<any[]>([])
const lastError = ref<string | null>(null)
const isDragging = ref(false)
const isGenerating = ref(false)

const bridge: any = (window as any)?.api

onMounted(async () => {
  if (!bridge) {
    lastError.value = '预加载桥接未就绪（window.api 不可用），请检查 sandbox 设置与 preload 加载路径'
    return
  }
  images.value = await bridge.image.list()
  styles.value = await bridge.style.list()

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
  window.addEventListener('keydown', onKey)

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
    window.removeEventListener('keydown', onKey)
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

async function handleUpload(evt: Event) {
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

function onDropFiles(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const files = Array.from(e.dataTransfer?.files || []).filter((f) => f.type.startsWith('image/'))
  if (files.length) uploadFiles(files)
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
</script>

<template>
  <div class="h-full w-full grid grid-cols-12">
    <!-- Left: images + upload -->
    <div
      class="col-span-3 border-r p-3 space-y-3"
      :class="{ 'bg-neutral-50 ring-2 ring-black': isDragging }"
      @dragover.prevent="isDragging = true"
      @dragenter.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop="onDropFiles"
    >
      <div class="flex items-center justify-between">
        <div class="font-semibold">待处理</div>
        <label class="cursor-pointer">
          <button class="btn btn-primary pointer-events-none">上传</button>
          <input type="file" multiple accept="image/*" class="hidden" @change="handleUpload" />
        </label>
      </div>
      <div class="space-y-2 overflow-auto" style="max-height: calc(100vh - 90px)">
        <button
          v-for="img in images"
          :key="img.id"
          @click="selectedImageId = img.id"
          class="w-full flex items-center gap-2 rounded p-2 border hover:bg-neutral-50"
          :class="{ 'ring-2 ring-black': selectedImageId === img.id }"
        >
          <img :src="dataUrl(img.mimeType, img.previewBase64)" class="h-12 w-12 object-cover rounded" />
          <div class="text-left">
            <div class="text-sm font-medium line-clamp-1">{{ img.filename || img.id }}</div>
            <div class="text-xs text-neutral-500">{{ (img.sizeBytes / 1024).toFixed(0) }} KB</div>
          </div>
        </button>
        <div v-if="images.length === 0" class="text-sm text-neutral-500">请先上传图片（支持拖拽）</div>
      </div>
      <div class="pt-2">
        <button class="btn btn-outline" :disabled="!selectedImageId" @click="deleteSelected">
          <Trash2 class="w-4 h-4 mr-1" /> 删除所选
        </button>
      </div>
    </div>

    <!-- Middle: config -->
    <div class="col-span-4 border-r p-4 space-y-4">
      <div class="font-semibold">配置</div>
      <div v-if="lastError" class="p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
        出错了：{{ lastError }}
        <button
          v-for="j in jobs.filter((j:any) => j.status === 'failed').slice(0,1)"
          :key="j.id"
          class="ml-3 px-2 py-1 text-xs rounded border border-red-300 hover:bg-red-100"
          @click="async () => { await bridge?.job.retry(j.id); lastError = null }"
        >重试</button>
      </div>
      <div>
        <div class="text-sm mb-2">风格预设</div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="s in styles"
            :key="s.id"
            class="btn"
            :class="selectedStyleId === s.id ? 'btn-primary' : 'btn-outline'"
            @click="selectedStyleId = s.id"
          >{{ s.name }}</button>
        </div>
      </div>
      <div>
        <div class="text-sm mb-2">尺寸比例</div>
        <div class="flex gap-2">
          <button
            v-for="a in ['1:1','3:4']"
            :key="a"
            class="btn"
            :class="aspect === a ? 'btn-primary' : 'btn-outline'"
            @click="aspect = a as any"
          >{{ a }}</button>
        </div>
      </div>
      <div>
        <button class="btn btn-primary" :disabled="!selectedImageId || isGenerating" @click="handleGenerate">
          {{ isGenerating ? '生成中…' : '开始生成' }}
        </button>
      </div>
    </div>

    <!-- Right: results -->
    <div class="col-span-5 p-4 space-y-4">
      <div class="font-semibold flex items-center justify-between">
        <span>结果预览</span>
        <button class="px-2 py-1 text-xs rounded border hover:bg-neutral-50" @click="openDownloadsDir">
          打开下载目录
        </button>
      </div>
      <div class="space-y-3 overflow-auto" style="max-height: calc(100vh - 90px)">
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
            <button class="btn btn-outline" @click="bridge?.file.download(r.id, `${selectedImage?.filename || r.id}`)">
              <Download class="w-4 h-4 mr-1" /> 下载
            </button>
          </div>
        </div>
        <div v-if="selectedImageId && results.length === 0" class="text-sm text-neutral-500">无生成结果，请点击“开始生成”</div>
        <div v-if="!selectedImageId" class="text-sm text-neutral-500">请选择一张图片</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
