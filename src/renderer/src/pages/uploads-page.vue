<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { Upload, Sparkles } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import type { ImageItem, StyleItem, GroupItem, ModelItem, PromptItem } from '@/types'
import { resizePreview, fileToBase64 } from '@/utils/image'
import GroupSidebar from '@/components/GroupSidebar.vue'
import UploadToolbar from '@/components/UploadToolbar.vue'
import ImageGrid from '@/components/ImageGrid.vue'
import ImagePreviewModal from '@/components/ImagePreviewModal.vue'
import GroupManagementDialogs from '@/components/GroupManagementDialogs.vue'
import GenerationConfirmDialog from '@/components/GenerationConfirmDialog.vue'
import BulkDeleteDialog from '@/components/BulkDeleteDialog.vue'

const bridge: any = (window as any)?.api

// === 数据状态 ===
const images = ref<ImageItem[]>([])
const styles = ref<StyleItem[]>([])
const groups = ref<GroupItem[]>([])
const models = ref<ModelItem[]>([])
const prompts = ref<PromptItem[]>([])
const groupCounts = ref<Record<string, number>>({})
const allCount = ref<number>(0)
const UNASSIGNED = '__UNASSIGNED__'
const selected = ref<Set<string>>(new Set())
const selectedModelKey = ref<string | null>(null)
const selectedPromptId = ref<string | null>(null)
const currentGroupId = ref<string | null>(null)
const moveTargetGroupId = ref<string | null>(null)

// 分组对话框状态
const createOpen = ref(false)
const renameOpen = ref(false)
const renameTarget = ref<GroupItem | null>(null)
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

// === 高级筛选状态 ===
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

// === 数据加载函数 ===
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
    images.value = await bridge.image.list()
  }
}

async function loadModelsAndPrompts() {
  const settings = await bridge.config.getAll()
  models.value = [
    {
      key: 'dashscope_model',
      name: '通义千问 (扩图)',
      provider: 'dashscope',
      available: !!(settings.dashscope_api_key && settings.dashscope_api_key.trim())
    },
    {
      key: 'openai_image_model', 
      name: 'OpenAI DALL-E',
      provider: 'openai',
      available: !!(settings.openai_api_key && settings.openai_api_key.trim())
    },
    {
      key: 'deepseek_image_model',
      name: 'DeepSeek',
      provider: 'deepseek', 
      available: !!(settings.deepseek_api_key && settings.deepseek_api_key.trim())
    }
  ]
  
  prompts.value = await bridge.prompt.list()
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

// === 事件处理函数 ===
async function uploadFiles(files: File[]) {
  const items: any[] = []
  for (const f of files) {
    const base64 = await fileToBase64(f)
    const preview = await resizePreview(f, 320)
    items.push({ filename: f.name, mimeType: f.type || 'image/png', sizeBytes: f.size, dataBase64: base64, previewBase64: preview })
  }
  const inserted = await bridge.image.upload(items)
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
  if (!selectedModelKey.value || !selectedPromptId.value) return
  isGenerating.value = true
  try {
    const ids = Array.from(selected.value)
    await bridge.job.bulkCreate({ 
      imageIds: ids, 
      modelKey: selectedModelKey.value,
      promptId: selectedPromptId.value,
      aspectRatio: aspect.value 
    })
    confirmOpen.value = false
    selected.value.clear()
  } finally {
    isGenerating.value = false
  }
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

// === 分组管理函数 ===
async function submitCreateGroup(name: string) {
  if (bridge?.group?.create) {
    const row = await bridge.group.create(name)
    await reloadGroups()
    if (row?.id) currentGroupId.value = row.id
  }
}

async function submitRenameGroup(group: GroupItem, newName: string) {
  if (bridge?.group?.rename) {
    await bridge.group.rename(group.id, newName)
    await reloadGroups()
  }
}

async function submitDeleteGroup(group: GroupItem) {
  if (bridge?.group?.delete) {
    await bridge.group.delete(group.id)
    if (currentGroupId.value === group.id) currentGroupId.value = null
    await reloadGroups()
    await reloadImages(currentGroupId.value)
  }
}

async function moveSelectedToGroup() {
  if (selected.value.size === 0) return
  if (bridge?.image?.moveToGroup) {
    await bridge.image.moveToGroup(Array.from(selected.value), moveTargetGroupId.value ?? null)
  }
  await reloadImages(currentGroupId.value)
  await reloadGroupCounts()
}

// === 右键菜单 ===
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

// === 生命周期和监听器 ===
onMounted(async () => {
  if (!bridge) return
  await reloadGroups()
  await reloadImages(currentGroupId.value)
  styles.value = await bridge.style.list()
  await loadModelsAndPrompts()
})

watch(currentGroupId, async (gid) => {
  await reloadImages((gid as any) ?? null)
  selected.value.clear()
})

watch(confirmOpen, (open) => {
  if (open) {
    if (!selectedModelKey.value) {
      const availableModel = models.value.find(m => m.available)
      if (availableModel) {
        selectedModelKey.value = availableModel.key
      }
    }
    if (!selectedPromptId.value && prompts.value.length > 0) {
      selectedPromptId.value = prompts.value[0].id
    }
  }
})

// === 组件事件处理器 ===
function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const files = Array.from(e.dataTransfer?.files || []).filter((f) => f.type.startsWith('image/'))
  if (files.length) uploadFiles(files)
}

async function handleUpload(evt: Event) {
  const input = evt.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return
  await uploadFiles(Array.from(files))
  input.value = ''
}

function handleToggle(id: string, checked: boolean) {
  if (checked) selected.value.add(id)
  else selected.value.delete(id)
}

function handleToggleAllOnPage(checked: boolean) {
  for (const it of pageItems.value) {
    if (checked) selected.value.add(it.id)
    else selected.value.delete(it.id)
  }
}

function handlePreview(image: ImageItem) {
  previewImage.value = image
  showPreview.value = true
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
      @drop="handleDrop"
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
      <GroupSidebar
        :groups="groups"
        :current-group-id="currentGroupId"
        :group-counts="groupCounts"
        :all-count="allCount"
        :UNASSIGNED="UNASSIGNED"
        @select-group="currentGroupId = $event"
        @create-group="createOpen = true"
        @rename-group="renameTarget = $event; renameOpen = true"
        @delete-group="deleteTarget = $event; deleteOpen = true"
      />

      <!-- 右侧素材展示区域 -->
      <section class="flex-1 min-w-0 flex flex-col space-y-6">
        <!-- 工具栏 -->
        <UploadToolbar
          v-model:search-query="searchQuery"
          v-model:view-mode="viewMode"
          v-model:sort-by="sortBy"
          v-model:sort-order="sortOrder"
          v-model:page-size="pageSize"
          v-model:move-target-group-id="moveTargetGroupId"
          :selected="selected"
          :groups="groups"
          :current-group-id="currentGroupId"
          :all-count="allCount"
          :group-counts="groupCounts"
          :UNASSIGNED="UNASSIGNED"
          @upload="handleUpload"
          @clear-selection="selected.clear()"
          @open-bulk-delete="bulkDeleteOpen = true"
          @move-selected-to-group="moveSelectedToGroup"
        />

        <!-- 生成操作条（点击后弹出确认框） -->
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

        <!-- 素材网格容器 -->
        <div class="flex-1 min-h-0 flex flex-col">
          <ImageGrid
            :page-items="pageItems"
            :view-mode="viewMode"
            :search-query="searchQuery"
            :selected="selected"
            v-model:page="page"
            :page-size="pageSize"
            :total="total"
            :is-dragging="isDragging"
            @toggle="handleToggle"
            @toggle-all-on-page="handleToggleAllOnPage"
            @preview="handlePreview"
            @context-menu="openContextMenu"
            @drop="handleDrop"
            @drag-enter="isDragging = true"
            @drag-leave="isDragging = false"
            @upload="handleUpload"
          />
        </div>
      </section>
    </div>

    <!-- 所有对话框组件 -->
    <GroupManagementDialogs
      v-model:create-open="createOpen"
      v-model:rename-open="renameOpen"
      v-model:delete-open="deleteOpen"
      :rename-target="renameTarget"
      :delete-target="deleteTarget"
      @create-group="submitCreateGroup"
      @rename-group="submitRenameGroup"
      @delete-group="submitDeleteGroup"
    />

    <GenerationConfirmDialog
      v-model:open="confirmOpen"
      v-model:selected-model-key="selectedModelKey"
      v-model:selected-prompt-id="selectedPromptId"
      v-model:aspect="aspect"
      :is-generating="isGenerating"
      :models="models"
      :prompts="prompts"
      :selected-count="selected.size"
      @generate="generateSelected"
    />

    <BulkDeleteDialog
      v-model:open="bulkDeleteOpen"
      :selected-count="selected.size"
      @confirm="submitBulkDelete"
    />

    <ImagePreviewModal
      :show="showPreview"
      :image="previewImage"
      @close="showPreview = false"
    />

    <!-- 右键菜单 -->
    <div v-if="ctxVisible" class="fixed inset-0 z-[9998]" @click="closeContextMenu"></div>
    <div
      v-if="ctxVisible && ctxImage"
      class="fixed z-[9999] card-base p-2 min-w-[200px]"
      :style="{ left: Math.min(ctxX, 1200 - 220) + 'px', top: Math.min(ctxY, 800 - 200) + 'px' }"
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