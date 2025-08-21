<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { Search, Grid3X3, Grid, Upload, Trash2, Sparkles, Eye, Download, MoreVertical, X, Check, AlertCircle, Pencil, Filter as FilterIcon, Plus, Folder } from 'lucide-vue-next'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose } from 'reka-ui'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationFirst, PaginationLast, PaginationNext, PaginationPrevious, PaginationItem } from '@/components/ui/pagination'
import type { ImageItem, StyleItem, GroupItem } from '@/types'

const bridge: any = (window as any)?.api

// === 数据状态 ===
const images = ref<ImageItem[]>([])
const styles = ref<StyleItem[]>([])
const groups = ref<GroupItem[]>([])
const groupCounts = ref<Record<string, number>>({})
const allCount = ref<number>(0)
const UNASSIGNED = '__UNASSIGNED__'
const selected = ref<Set<string>>(new Set())
const selectedStyleId = ref<string | null>(null)
const currentGroupId = ref<string | null>(null)
const moveTargetGroupId = ref<string | null>(null)
const moveTargetGroupIdStr = computed({
  get: () => (moveTargetGroupId.value === null ? 'null' : String(moveTargetGroupId.value)),
  set: (v: string) => { moveTargetGroupId.value = v === 'null' ? null : v }
})

// 分组对话框状态
const createOpen = ref(false)
const createName = ref('')
const renameOpen = ref(false)
const renameTarget = ref<GroupItem | null>(null)
const renameName = ref('')
const deleteOpen = ref(false)
const deleteTarget = ref<GroupItem | null>(null)

// === UI状态 ===
const isGenerating = ref(false)
const isDragging = ref(false)
const searchQuery = ref('')
const sortBy = ref<'name' | 'date' | 'size'>('date')
const sortOrder = ref<'asc' | 'desc'>('desc')
const viewMode = ref<'grid' | 'list'>('grid')
const aspect = ref<'1:1' | '3:4'>('1:1')
const confirmOpen = ref(false)
const bulkDeleteOpen = ref(false)

// === 分页状态 ===
const page = ref(1)
const pageSize = ref(24)
const pageSizeStr = computed({ get: () => String(pageSize.value), set: (v: string) => (pageSize.value = Number(v || 0) || pageSize.value) })

// === 高级筛选状态 ===
// 使用 shadcn-vue Accordion 替换原有筛选折叠逻辑
const filterMinSize = ref(0)
const filterMaxSize = ref(0)

// === 预览状态 ===
const previewImage = ref<ImageItem | null>(null)
const showPreview = ref(false)

// === 数据处理 ===
const filteredImages = computed(() => {
  let result = [...images.value]
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(img => 
      img.filename?.toLowerCase().includes(query) ||
      img.id.toLowerCase().includes(query)
    )
  }
  
  // 尺寸过滤
  if (filterMinSize.value > 0) {
    result = result.filter(img => img.sizeBytes >= filterMinSize.value * 1024)
  }
  if (filterMaxSize.value > 0) {
    result = result.filter(img => img.sizeBytes <= filterMaxSize.value * 1024)
  }
  
  // 排序
  result.sort((a, b) => {
    let comparison = 0
    switch (sortBy.value) {
      case 'name':
        comparison = (a.filename || a.id).localeCompare(b.filename || b.id)
        break
      case 'date':
        comparison = (a.createdAt || 0) - (b.createdAt || 0)
        break
      case 'size':
        comparison = a.sizeBytes - b.sizeBytes
        break
    }
    return sortOrder.value === 'desc' ? -comparison : comparison
  })
  
  return result
})

const total = computed(() => filteredImages.value.length)
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const pageItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredImages.value.slice(start, start + pageSize.value)
})

async function reloadGroups() {
  if (!bridge) return
  try {
    if (bridge?.group?.list) {
      groups.value = await bridge.group.list()
    } else {
      groups.value = []
    }
  } catch {
    groups.value = []
  }
  await reloadGroupCounts()
}

async function reloadImages(gid: string | null | typeof UNASSIGNED) {
  if (!bridge) return
  try {
    if (gid === UNASSIGNED) {
      let all: ImageItem[] = []
      try {
        all = await bridge.image.list()
      } catch {
        all = await bridge.image.list({ groupId: null })
      }
      images.value = all.filter((it: any) => !it.groupId)
    } else {
      images.value = await bridge.image.list({ groupId: gid })
    }
  } catch (e) {
    // fallback to legacy API without params if preload/main not updated together
    images.value = await bridge.image.list()
  }
}

onMounted(async () => {
  if (!bridge) return
  await reloadGroups()
  await reloadImages(currentGroupId.value)
  styles.value = await bridge.style.list()
})

watch(currentGroupId, async (gid) => {
  await reloadImages((gid as any) ?? null)
  selected.value.clear()
})

watch(confirmOpen, (open) => {
  if (open && !selectedStyleId.value && styles.value.length > 0) {
    selectedStyleId.value = styles.value[0].id
  }
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
    const base64 = await fileToBase64(f)
    const preview = await resizePreview(f, 320)
    items.push({ filename: f.name, mimeType: f.type || 'image/png', sizeBytes: f.size, dataBase64: base64, previewBase64: preview })
  }
  const inserted = await bridge.image.upload(items)
  // 若当前选择了某个分组（非“未分组/所有分组”），将新上传的图片归入该分组
  if (currentGroupId.value && (currentGroupId.value as any) !== UNASSIGNED) {
    try {
      const ids = Array.isArray(inserted) ? inserted.map((r:any) => r.id) : []
      if (ids.length && bridge?.image?.moveToGroup) {
        await bridge.image.moveToGroup(ids, currentGroupId.value)
      }
    } catch {}
  }
  await reloadImages(currentGroupId.value)
  await reloadGroupCounts()
}

async function generateSelected() {
  if (selected.value.size === 0) return
  if (!selectedStyleId.value) return
  isGenerating.value = true
  const ids = Array.from(selected.value)
  await bridge.job.bulkCreate({ imageIds: ids, styleId: selectedStyleId.value, aspectRatio: aspect.value })
  isGenerating.value = false
  confirmOpen.value = false
}

async function submitBulkDelete() {
  if (selected.value.size === 0) {
    bulkDeleteOpen.value = false
    return
  }
  for (const id of Array.from(selected.value)) {
    await bridge.image.delete(id)
  }
  selected.value.clear()
  await reloadImages(currentGroupId.value)
  await reloadGroupCounts()
  bulkDeleteOpen.value = false
}

async function resizePreview(file: File, maxWidth: number): Promise<string> {
  // Use data URL to satisfy CSP (img-src 'self' data:)
  const dataUrlSrc = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (e) => reject(e)
    reader.readAsDataURL(file)
  })
  try {
    const img = await loadImage(dataUrlSrc)
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
    // nothing to revoke when using FileReader data URL
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

// 将文件读取为base64（不带data:前缀）
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = (e) => reject(e)
    reader.readAsDataURL(file)
  })
}

function dataUrl(mime: string, base64?: string | null) {
  if (!base64) return ''
  return `data:${mime};base64,${base64}`
}

// === 辅助函数 ===
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// === 分组相关 ===
function openCreateGroup() {
  createName.value = ''
  createOpen.value = true
}

async function submitCreateGroup() {
  const name = createName.value.trim()
  if (!name) return
  if (bridge?.group?.create) {
    const row = await bridge.group.create(name)
    await reloadGroups()
    if (row?.id) currentGroupId.value = row.id
  }
  createOpen.value = false
}

async function moveSelectedToGroup() {
  if (selected.value.size === 0) return
  if (bridge?.image?.moveToGroup) {
    await bridge.image.moveToGroup(Array.from(selected.value), moveTargetGroupId.value ?? null)
  }
  await reloadImages(currentGroupId.value)
  await reloadGroupCounts()
}

async function reloadGroupCounts() {
  if (!bridge) return
  try {
    let all: ImageItem[] = []
    try {
      all = await bridge.image.list()
    } catch {
      all = await bridge.image.list({ groupId: null })
    }
    const counts: Record<string, number> = {}
    let total = 0
    for (const it of all as ImageItem[]) {
      total++
      const gid = (it as any).groupId || null
      const key = gid as unknown as string | null
      const k = key === null ? 'null' : String(key)
      counts[k] = (counts[k] || 0) + 1
    }
    groupCounts.value = counts
    allCount.value = total
  } catch {
    groupCounts.value = {}
    allCount.value = 0
  }
}

function openRenameGroup(g: GroupItem) {
  renameTarget.value = g
  renameName.value = g.name
  renameOpen.value = true
}

async function submitRenameGroup() {
  const g = renameTarget.value
  const newName = renameName.value.trim()
  if (!g || !newName || newName === g.name) {
    renameOpen.value = false
    return
  }
  if (bridge?.group?.rename) {
    await bridge.group.rename(g.id, newName)
    await reloadGroups()
  }
  renameOpen.value = false
}

function openDeleteGroup(g: GroupItem) {
  deleteTarget.value = g
  deleteOpen.value = true
}

async function submitDeleteGroup() {
  const g = deleteTarget.value
  if (!g) {
    deleteOpen.value = false
    return
  }
  if (bridge?.group?.delete) {
    await bridge.group.delete(g.id)
    if (currentGroupId.value === g.id) currentGroupId.value = null
    await reloadGroups()
    await reloadImages(currentGroupId.value)
  }
  deleteOpen.value = false
}

// === 单项右键菜单 ===
const ctxVisible = ref(false)
const ctxX = ref(0)
const ctxY = ref(0)
const ctxImage = ref<ImageItem | null>(null)

function openContextMenu(e: MouseEvent, item: ImageItem) {
  e.preventDefault()
  ctxVisible.value = true
  ctxX.value = e.clientX
  ctxY.value = e.clientY
  ctxImage.value = item
}

function closeContextMenu() {
  ctxVisible.value = false
  ctxImage.value = null
}

async function moveSingleToGroup(groupId: string | null) {
  if (!ctxImage.value) return
  if (bridge?.image?.moveToGroup) {
    await bridge.image.moveToGroup([ctxImage.value.id], groupId)
  }
  closeContextMenu()
  await reloadImages(currentGroupId.value)
  await reloadGroupCounts()
}
</script>

<template>
  <div class="h-full flex flex-col bg-[hsl(var(--background))] animate-fade-in overflow-hidden">
    <!-- === 智能拖拽上传区域重设计 === -->
    <div 
      :class="[
        'fixed inset-0 z-50 flex items-center justify-center transition-all duration-500',
        isDragging ? 'opacity-100 visible backdrop-blur-xl' : 'opacity-0 invisible pointer-events-none'
      ]"
      @dragover.prevent
      @dragenter.prevent
      @dragleave="isDragging = false"
      @drop="onDropFiles"
    >
      <div class="dropzone-active p-16 rounded-3xl text-center max-w-2xl mx-auto shadow-dramatic border-2 border-[hsl(var(--primary))] bg-[hsl(var(--surface-primary))]/90 backdrop-blur-xl">
        <div class="relative mb-8">
          <Upload class="h-24 w-24 mx-auto text-[hsl(var(--primary))] animate-float" />
          <div class="absolute inset-0 h-24 w-24 mx-auto bg-[hsl(var(--primary))]/20 rounded-full animate-ping"></div>
        </div>
        <h3 class="text-2xl font-bold mb-3 text-[hsl(var(--text-primary))] text-gradient">释放以上传创意素材</h3>
        <p class="text-[hsl(var(--text-secondary))] text-lg mb-6">支持 JPG、PNG、WebP、HEIC 等多种格式</p>
        <div class="flex items-center justify-center gap-6 text-sm text-[hsl(var(--text-tertiary))]">
          <div class="flex items-center gap-2">
            <div class="h-2 w-2 rounded-full bg-emerald-500"></div>
            <span>智能批量处理</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="h-2 w-2 rounded-full bg-blue-500"></div>
            <span>自动分组管理</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="h-2 w-2 rounded-full bg-purple-500"></div>
            <span>AI 风格增强</span>
          </div>
        </div>
      </div>
    </div>

    <!-- === 重新设计的双栏布局 === -->
    <div class="flex-1 min-h-0 flex gap-6 p-6">
      <!-- 左侧分组管理面板 -->
      <aside class="w-72 shrink-0 space-y-6">
        <!-- 分组管理头部 -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-8 w-8 rounded-lg bg-[hsl(var(--primary))] flex items-center justify-center">
              <component :is="Grid3X3" class="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-[hsl(var(--text-primary))]">素材分组</h2>
              <p class="text-xs text-[hsl(var(--text-tertiary))]">智能管理你的创意资源</p>
            </div>
          </div>
          <Button variant="outline" class="btn-primary text-sm" @click="openCreateGroup">
            <component :is="Plus" class="h-4 w-4 mr-2" />
            新建分组
          </Button>
        </div>

        <!-- 分组列表容器 -->
        <div class="card-elevated p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          <!-- 所有分组项 -->
          <div
            :class="[
              'group flex items-center justify-between p-4 rounded-xl transition-all duration-300 cursor-pointer border-2',
              currentGroupId === null 
                ? 'bg-[hsl(var(--primary))]/10 border-[hsl(var(--primary))]/30' 
                : 'border-transparent hover:bg-[hsl(var(--surface-secondary))] hover:border-[hsl(var(--border-subtle))]'
            ]"
            @click="currentGroupId = null"
          >
            <div class="flex items-center gap-3">
              <div class="relative">
                <div class="h-10 w-10 rounded-xl bg-slate-600 flex items-center justify-center shadow-floating">
                  <component :is="Grid3X3" class="h-5 w-5 text-white" />
                </div>
                <div v-if="currentGroupId === null" class="absolute -top-1 -right-1 h-3 w-3 bg-[hsl(var(--primary))] rounded-full animate-pulse"></div>
              </div>
              <div>
                <div class="font-semibold text-[hsl(var(--text-primary))]">所有分组</div>
                <div class="text-xs text-[hsl(var(--text-tertiary))]">查看全部素材</div>
              </div>
            </div>
            <div class="badge-primary">{{ allCount }}</div>
          </div>
          <!-- 自定义分组列表 -->
          <div v-for="g in groups" :key="g.id"
            :class="[
              'group flex items-center justify-between p-4 rounded-xl transition-all duration-300 cursor-pointer border-2',
              currentGroupId === g.id 
                ? 'bg-[hsl(var(--primary))]/10 border-[hsl(var(--primary))]/30' 
                : 'border-transparent hover:bg-[hsl(var(--surface-secondary))] hover:border-[hsl(var(--border-subtle))]'
            ]"
            @click="currentGroupId = g.id"
          >
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <div class="relative">
                <div class="h-10 w-10 rounded-xl bg-[hsl(var(--primary))] flex items-center justify-center shadow-floating">
                  <component :is="Folder" class="h-5 w-5 text-white" />
                </div>
                <div v-if="currentGroupId === g.id" class="absolute -top-1 -right-1 h-3 w-3 bg-[hsl(var(--primary))] rounded-full animate-pulse"></div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-[hsl(var(--text-primary))] truncate">{{ g.name }}</div>
                <div class="text-xs text-[hsl(var(--text-tertiary))]">{{ groupCounts[String(g.id)] || 0 }} 个素材</div>
              </div>
            </div>
            <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" class="h-8 w-8 p-0 hover:bg-[hsl(var(--primary))]/10" title="重命名" @click.stop="openRenameGroup(g)">
                <Pencil class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" class="h-8 w-8 p-0 hover:bg-red-500/10 text-red-500" title="删除" @click.stop="openDeleteGroup(g)">
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
            <div class="badge">{{ groupCounts[String(g.id)] || 0 }}</div>
          </div>

          <!-- 未分组项 -->
          <div
            :class="[
              'group flex items-center justify-between p-4 rounded-xl transition-all duration-300 cursor-pointer border-2',
              currentGroupId === UNASSIGNED 
                ? 'bg-orange-500/10 border-orange-500/30' 
                : 'border-transparent hover:bg-[hsl(var(--surface-secondary))] hover:border-[hsl(var(--border-subtle))]'
            ]"
            @click="currentGroupId = UNASSIGNED as any"
          >
            <div class="flex items-center gap-3">
              <div class="relative">
                <div class="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-floating">
                  <component :is="AlertCircle" class="h-5 w-5 text-white" />
                </div>
                <div v-if="currentGroupId === UNASSIGNED" class="absolute -top-1 -right-1 h-3 w-3 bg-orange-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <div class="font-semibold text-[hsl(var(--text-primary))]">未分组</div>
                <div class="text-xs text-[hsl(var(--text-tertiary))]">待整理的素材</div>
              </div>
            </div>
            <div class="badge-warning">{{ groupCounts['null'] || 0 }}</div>
          </div>
        </div>
      </aside>

      <!-- 右侧素材展示区域 -->
      <section class="flex-1 min-w-0 flex flex-col space-y-6">
        <!-- === 精致的工具栏 === -->
        <div class="glass-panel p-6 rounded-2xl space-y-4">
          <!-- 主要操作区 -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <!-- 上传按钮重设计 -->
              <label class="cursor-pointer">
                <Button class="btn-primary shadow-floating">
                  <Upload class="h-5 w-5 mr-2" />
                  <span class="font-semibold">上传素材</span>
                </Button>
                <input type="file" multiple accept="image/*" class="hidden" @change="onInputChange" />
              </label>
              
              <!-- AI 生成按钮 -->
              <Button variant="outline" class="border-gradient">
                <Sparkles class="h-5 w-5 mr-2 text-[hsl(var(--accent))]" />
                <span class="font-semibold">AI 生成</span>
              </Button>
            </div>

            <!-- 右侧工具组 -->
            <div class="flex items-center gap-4">
              <!-- 当前分组状态 -->
              <div class="flex items-center gap-3 px-4 py-2 rounded-xl bg-[hsl(var(--surface-secondary))] border border-[hsl(var(--border-subtle))]">
                <div class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span class="text-sm font-medium text-[hsl(var(--text-primary))]">
                  <span v-if="currentGroupId === null">全部素材</span>
                  <span v-else-if="currentGroupId === (UNASSIGNED as any)">未分组</span>
                  <span v-else>{{ (groups.find(g=>g.id===currentGroupId) || {name:'分组'}).name }}</span>
                </span>
                <div class="badge-primary">
                  <span v-if="currentGroupId === null">{{ allCount }}</span>
                  <span v-else-if="currentGroupId === (UNASSIGNED as any)">{{ groupCounts['null'] || 0 }}</span>
                  <span v-else>{{ groupCounts[String(currentGroupId)] || 0 }}</span>
                </div>
              </div>

              <!-- 搜索框重设计 -->
              <div class="relative">
                <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(var(--text-tertiary))]" />
                <Input 
                  v-model="searchQuery" 
                  type="text" 
                  placeholder="搜索你的创意素材..." 
                  class="pl-12 pr-12 w-80 bg-[hsl(var(--surface-primary))] border-[hsl(var(--border-subtle))] focus:border-[hsl(var(--primary))] text-[hsl(var(--text-primary))]" 
                />
                <Button 
                  v-if="searchQuery" 
                  variant="ghost" 
                  @click="searchQuery = ''" 
                  class="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-[hsl(var(--surface-secondary))] rounded-lg"
                >
                  <X class="h-4 w-4" />
                </Button>
              </div>
              
              <!-- 视图切换重设计 -->
              <div class="segmented bg-[hsl(var(--surface-secondary))]">
                <Button variant="ghost" :class="['segmented-item', { 'is-active': viewMode === 'grid' }]" @click="viewMode = 'grid'" title="网格视图">
                  <Grid3X3 class="h-5 w-5" />
                </Button>
                <Button variant="ghost" :class="['segmented-item', { 'is-active': viewMode === 'list' }]" @click="viewMode = 'list'" title="列表视图">
                  <Grid class="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          <!-- 批量操作条 -->
          <div v-if="selected.size > 0" class="flex items-center justify-between p-4 bg-[hsl(var(--primary))]/5 rounded-xl border border-[hsl(var(--primary))]/20 animate-slide-in-from-top">
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <div class="h-8 w-8 rounded-lg bg-[hsl(var(--primary))] flex items-center justify-center">
                  <Check class="h-5 w-5 text-white" />
                </div>
                <span class="font-semibold text-[hsl(var(--text-primary))]">已选择 {{ selected.size }} 个素材</span>
              </div>
              <div class="flex items-center gap-3">
                <Select v-model="moveTargetGroupIdStr" class="min-w-[180px]">
                  <SelectTrigger class="bg-[hsl(var(--surface-primary))] border-[hsl(var(--border-subtle))]">
                    <SelectValue placeholder="移动到分组..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">移动到：未分组</SelectItem>
                    <SelectItem v-for="g in groups" :key="g.id" :value="String(g.id)">{{ g.name }}</SelectItem>
                  </SelectContent>
                </Select>
                <Button @click="moveSelectedToGroup" class="btn-primary">
                  <component :is="Folder" class="h-4 w-4 mr-2" />
                  移动
                </Button>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Button variant="outline" @click="selected.clear()" class="text-[hsl(var(--text-secondary))]">
                取消选择
              </Button>
              <Button variant="destructive" @click="bulkDeleteOpen = true" class="btn-danger">
                <Trash2 class="h-4 w-4 mr-2" />
                删除
              </Button>
            </div>
          </div>
        </div>

        <!-- === 高级筛选面板（Accordion） === -->
        <Accordion type="single" collapsible>
          <AccordionItem value="filters">
            <AccordionTrigger class="glass-panel px-4 py-3 rounded-xl border border-[hsl(var(--border-subtle))] text-left">
              <div class="flex items-center gap-2">
                <FilterIcon class="h-4 w-4" />
                <span class="text-sm font-medium">高级筛选</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div class="glass-panel p-4 rounded-xl mt-2 animate-slide-in-from-top">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium mb-2">排序方式</label>
                    <Select v-model="sortBy">
                      <SelectTrigger><SelectValue placeholder="按日期" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">按日期</SelectItem>
                        <SelectItem value="name">按名称</SelectItem>
                        <SelectItem value="size">按大小</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-2">排序顺序</label>
                    <Select v-model="sortOrder">
                      <SelectTrigger><SelectValue placeholder="降序" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">降序</SelectItem>
                        <SelectItem value="asc">升序</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-2">每页显示</label>
                    <Select v-model="pageSizeStr">
                      <SelectTrigger><SelectValue placeholder="24项" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12项</SelectItem>
                        <SelectItem value="24">24项</SelectItem>
                        <SelectItem value="48">48项</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <!-- === 生成操作条（点击后弹出确认框） === -->
        <div v-if="selected.size > 0" class="glass-panel p-4 rounded-xl border border-[hsl(var(--primary))]/20 bg-[hsl(var(--primary))]/5 animate-slide-in-from-bottom">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <Sparkles class="h-5 w-5 text-[hsl(var(--primary))]" />
              <span class="font-medium">已选择 {{ selected.size }} 项</span>
            </div>
            <Button :disabled="isGenerating" @click="confirmOpen = true" class="btn-primary">
              <span v-if="isGenerating" class="spinner mr-2"></span>
              <Sparkles v-else class="w-4 h-4 mr-1" />
              生成
            </Button>
          </div>
        </div>

        <!-- === 素材网格容器 === -->
        <div class="flex-1 min-h-0 flex flex-col">
          <!-- 状态栏 -->
          <div class="flex items-center justify-between p-4 bg-[hsl(var(--surface-secondary))]/50 rounded-xl border border-[hsl(var(--border-subtle))]">
            <div class="flex items-center gap-4">
              <span class="text-[hsl(var(--text-primary))] font-medium">{{ total }} 个素材</span>
              <span v-if="searchQuery" class="text-[hsl(var(--text-secondary))]">搜索: "{{ searchQuery }}"</span>
            </div>
            
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 cursor-pointer hover:text-[hsl(var(--text-primary))] transition-colors">
                <input type="checkbox" @change="(e:any)=>toggleAllOnPage(e.target.checked)" class="rounded" />
                <span class="text-sm">本页全选</span>
              </label>
            </div>
          </div>

          <!-- 素材网格 -->
          <div class="flex-1 overflow-auto mt-4">
            <div 
              v-if="viewMode === 'grid'"
              class="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 animate-fade-in"
              @dragover.prevent="isDragging = true"
              @dragenter.prevent="isDragging = true"
              @dragleave="isDragging = false"
            >
              <!-- 空状态 -->
              <div v-if="pageItems.length === 0 && !searchQuery" class="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <div class="dropzone-idle p-12 max-w-lg mx-auto">
                  <Upload class="h-20 w-20 mx-auto mb-6 text-[hsl(var(--text-tertiary))] animate-float" />
                  <h3 class="text-xl font-bold mb-4 text-[hsl(var(--text-primary))]">开始上传创意素材</h3>
                  <p class="text-[hsl(var(--text-secondary))] mb-8 leading-relaxed">
                    拖拽图片到此处，或点击按钮选择文件
                  </p>
                  <label class="btn-primary cursor-pointer shadow-floating">
                    <Upload class="h-5 w-5 mr-2" />
                    选择文件
                    <input type="file" multiple accept="image/*" class="hidden" @change="onInputChange" />
                  </label>
                </div>
              </div>
              
              <!-- 搜索无结果 -->
              <div v-else-if="pageItems.length === 0 && searchQuery" class="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <AlertCircle class="h-16 w-16 mb-4 text-[hsl(var(--text-tertiary))]" />
                <h3 class="text-lg font-semibold mb-2 text-[hsl(var(--text-primary))]">未找到匹配的素材</h3>
                <p class="text-[hsl(var(--text-secondary))]">尝试修改搜索关键词或清除筛选条件</p>
              </div>
              
              <!-- 图片卡片 -->
              <div
                v-for="(item, index) in pageItems"
                :key="item.id"
                class="card-interactive group relative overflow-hidden animate-scale-in"
                :style="{ animationDelay: `${index * 50}ms` }"
                @click="previewImage = item; showPreview = true"
                @contextmenu.prevent="openContextMenu($event, item)"
              >
                <!-- 选择框 -->
                <label class="absolute top-3 left-3 z-10 cursor-pointer" @click.stop>
                  <input
                    type="checkbox"
                    :checked="isChecked(item.id)"
                    @change="(e:any)=>toggle(item.id,e.target.checked)"
                    class="w-5 h-5 rounded border-2 border-white/50 bg-white/10 backdrop-blur-sm"
                  />
                </label>
                
                <!-- 快捷操作 -->
                <div class="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <Button variant="ghost" class="p-2 bg-black/20 backdrop-blur-sm rounded-lg text-white hover:bg-black/30" title="预览">
                    <Eye class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" class="p-2 bg-black/20 backdrop-blur-sm rounded-lg text-white hover:bg-black/30" title="下载">
                    <Download class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" class="p-2 bg-black/20 backdrop-blur-sm rounded-lg text-white hover:bg-black/30" title="更多">
                    <MoreVertical class="h-4 w-4" />
                  </Button>
                </div>
                
                <!-- 图片 -->
                <div class="aspect-square overflow-hidden rounded-t-xl">
                  <img
                    :src="dataUrl(item.mimeType, item.previewBase64)"
                    :alt="item.filename || item.id"
                    class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
                
                <!-- 信息区域 -->
                <div class="p-4">
                  <h3 class="font-semibold text-sm text-[hsl(var(--text-primary))] truncate mb-2">
                    {{ item.filename || item.id }}
                  </h3>
                  <div class="flex items-center justify-between text-xs text-[hsl(var(--text-tertiary))]">
                    <span>{{ formatFileSize(item.sizeBytes) }}</span>
                    <span v-if="item.createdAt">{{ formatDate(item.createdAt) }}</span>
                  </div>
                </div>
                
                <!-- 加载状态指示器 -->
                <div v-if="!item.previewBase64" class="absolute inset-0 flex items-center justify-center bg-[hsl(var(--surface-primary))]/90">
                  <div class="spinner h-6 w-6"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <div v-if="pageCount > 1" class="mt-6">
            <Pagination v-model:page="page" :total="total" :items-per-page="pageSize" :sibling-count="1" :show-edges="pageCount > 7">
              <PaginationContent v-slot="{ items }" class="justify-center">
                <PaginationFirst v-if="pageCount > 7" />
                <PaginationPrevious />
                <template v-for="(p, idx) in items" :key="idx">
                  <PaginationItem v-if="p.type==='page'" :value="p.value" :is-active="p.value === page">{{ p.value }}</PaginationItem>
                  <PaginationEllipsis v-else :index="idx" />
                </template>
                <PaginationNext />
                <PaginationLast v-if="pageCount > 7" />
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </section>
    </div>

    <!-- === 生成确认弹窗（Reka UI Dialog） === -->
    <DialogRoot v-model:open="confirmOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <DialogContent class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] max-w-[90vw] card-base p-4">
          <DialogTitle class="text-lg font-semibold mb-1">选择风格与尺寸</DialogTitle>
          <DialogDescription class="text-sm text-[hsl(var(--muted-foreground))] mb-4">
            请确认本次生成使用的艺术风格与比例。
          </DialogDescription>

          <!-- 风格选择 -->
          <div class="mb-4">
            <div class="text-sm mb-2">风格预设</div>
            <div class="grid grid-cols-3 gap-2 max-h-60 overflow-auto pr-1">
              <Button
                v-for="s in styles"
                :key="s.id"
                :variant="selectedStyleId === s.id ? 'default' : 'outline'"
                @click="selectedStyleId = s.id"
              >{{ s.name }}</Button>
            </div>
          </div>

          <!-- 尺寸选择 -->
          <div class="mb-4">
            <div class="text-sm mb-2">尺寸比例</div>
            <div class="segmented">
              <Button variant="ghost" :class="['segmented-item', { 'is-active': aspect === '1:1' }]" @click="aspect = '1:1'">1:1 正方形</Button>
              <Button variant="ghost" :class="['segmented-item', { 'is-active': aspect === '3:4' }]" @click="aspect = '3:4'">3:4 竖版</Button>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t">
            <DialogClose as-child>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button :disabled="!selectedStyleId || isGenerating" @click="generateSelected">
              <span v-if="isGenerating" class="spinner mr-2"></span>
              确认生成
            </Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>



    <!-- === 图片预览模态框 === -->
    <Teleport to="body">
      <div
        v-if="showPreview && previewImage"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
        @click="showPreview = false"
      >
        <div class="relative max-w-4xl max-h-[90vh] m-4" @click.stop>
          <img
            :src="dataUrl(previewImage.mimeType, previewImage.previewBase64)"
            :alt="previewImage.filename || previewImage.id"
            class="max-w-full max-h-full rounded-xl shadow-dramatic"
          />
          <Button
            variant="ghost"
            @click="showPreview = false"
            class="absolute -top-4 -right-4 p-2 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
          >
            <X class="h-6 w-6" />
          </Button>
          
          <!-- 图片信息 -->
          <div class="absolute bottom-0 left-0 right-0 bg-black/60 p-6 rounded-b-xl text-white">
            <h3 class="font-semibold text-lg mb-2">{{ previewImage.filename || previewImage.id }}</h3>
            <div class="flex items-center gap-4 text-sm text-white/80">
              <span>{{ formatFileSize(previewImage.sizeBytes) }}</span>
              <span v-if="previewImage.createdAt">{{ formatDate(previewImage.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
    <!-- 分组：新建对话框 -->
    <DialogRoot v-model:open="createOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <DialogContent class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[90vw] card-base p-4">
          <DialogTitle class="text-lg font-semibold mb-1">新建分组</DialogTitle>
          <DialogDescription class="text-sm text-[hsl(var(--muted-foreground))] mb-3">请输入分组名称</DialogDescription>
          <Input v-model="createName" class="w-full" placeholder="分组名称" @keyup.enter="submitCreateGroup" />
          <div class="flex items-center justify-end gap-2 mt-4">
            <DialogClose as-child>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button :disabled="!createName.trim()" @click="submitCreateGroup">创建</Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <!-- 分组：重命名对话框 -->
    <DialogRoot v-model:open="renameOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <DialogContent class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[90vw] card-base p-4">
          <DialogTitle class="text-lg font-semibold mb-1">重命名分组</DialogTitle>
          <DialogDescription class="text-sm text-[hsl(var(--muted-foreground))] mb-3">请输入新的名称</DialogDescription>
          <Input v-model="renameName" class="w-full" placeholder="新名称" @keyup.enter="submitRenameGroup" />
          <div class="flex items-center justify-end gap-2 mt-4">
            <DialogClose as-child>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button :disabled="!renameName.trim()" @click="submitRenameGroup">保存</Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <!-- 分组：删除确认对话框 -->
    <DialogRoot v-model:open="deleteOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <DialogContent class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[90vw] card-base p-4">
          <DialogTitle class="text-lg font-semibold mb-1">删除分组</DialogTitle>
          <DialogDescription class="text-sm text-[hsl(var(--muted-foreground))] mb-3">
            确定删除“{{ deleteTarget?.name }}”？组内图片将变为未分组。
          </DialogDescription>
          <div class="flex items-center justify-end gap-2 mt-2">
            <DialogClose as-child>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button variant="destructive" @click="submitDeleteGroup">删除</Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <!-- 批量删除确认对话框 -->
    <DialogRoot v-model:open="bulkDeleteOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <DialogContent class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-w-[90vw] card-base p-4">
          <DialogTitle class="text-lg font-semibold mb-1">删除所选素材</DialogTitle>
          <DialogDescription class="text-sm text-[hsl(var(--muted-foreground))] mb-3">
            将删除选中的 {{ selected.size }} 张图片及其关联的任务与结果，且不可恢复。
          </DialogDescription>
          <div class="flex items-center justify-end gap-2 mt-2">
            <DialogClose as-child>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button variant="destructive" @click="submitBulkDelete">删除</Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
    <!-- 右键菜单 -->
    <div v-if="ctxVisible" class="fixed inset-0 z-[9998]" @click="closeContextMenu"></div>
    <div
      v-if="ctxVisible && ctxImage"
      class="fixed z-[9999] card-base p-2 min-w-[200px]"
      :style="{ left: Math.min(ctxX, window.innerWidth - 220) + 'px', top: Math.min(ctxY, window.innerHeight - 200) + 'px' }"
    >
      <div class="text-xs text-[hsl(var(--muted-foreground))] px-2 py-1">移动到分组</div>
      <Button variant="ghost" class="w-full justify-start px-2 py-1 hover:bg-[hsl(var(--muted))] rounded" @click="moveSingleToGroup(null)">未分组</Button>
      <div class="max-h-60 overflow-auto">
        <Button
          v-for="g in groups"
          :key="g.id"
          variant="ghost"
          class="w-full justify-start px-2 py-1 hover:bg-[hsl(var(--muted))] rounded"
          @click="moveSingleToGroup(g.id)"
        >{{ g.name }}</Button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
