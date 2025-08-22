<script setup lang="ts">
import { computed } from 'vue'
import { Search, Grid3X3, Grid, Upload, Sparkles, X, Check, Trash2, Folder, FilterIcon } from 'lucide-vue-next'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import type { GroupItem } from '@/types'

interface Props {
  searchQuery: string
  viewMode: 'grid' | 'list'
  sortBy: 'name' | 'date' | 'size'
  sortOrder: 'asc' | 'desc'
  pageSize: number
  selected: Set<string>
  groups: GroupItem[]
  currentGroupId: string | null
  allCount: number
  groupCounts: Record<string, number>
  moveTargetGroupId: string | null
  UNASSIGNED: string
  isUploading: boolean
  uploadProgress: string
}

interface Emits {
  (e: 'update:searchQuery', value: string): void
  (e: 'update:viewMode', value: 'grid' | 'list'): void
  (e: 'update:sortBy', value: 'name' | 'date' | 'size'): void
  (e: 'update:sortOrder', value: 'asc' | 'desc'): void
  (e: 'update:pageSize', value: number): void
  (e: 'update:moveTargetGroupId', value: string | null): void
  (e: 'upload', event: Event): void
  (e: 'clearSelection'): void
  (e: 'openBulkDelete'): void
  (e: 'moveSelectedToGroup'): void
  (e: 'openGenerate'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const pageSizeStr = computed({
  get: () => String(props.pageSize),
  set: (v: string) => emit('update:pageSize', Number(v || 0) || props.pageSize)
})

const moveTargetGroupIdStr = computed({
  get: () => (props.moveTargetGroupId === null ? 'null' : String(props.moveTargetGroupId)),
  set: (v: string) => emit('update:moveTargetGroupId', v === 'null' ? null : v)
})

function onInputChange(evt: Event) {
  console.log('UploadToolbar: File input changed', evt)
  emit('upload', evt)
}

function clearSearch() {
  emit('update:searchQuery', '')
}

function getCurrentGroupInfo() {
  if (props.currentGroupId === null) {
    return { name: '全部素材', count: props.allCount }
  } else if (props.currentGroupId === (props.UNASSIGNED as any)) {
    return { name: '未分组', count: props.groupCounts['null'] || 0 }
  } else {
    const group = props.groups.find(g => g.id === props.currentGroupId)
    return { 
      name: group?.name || '分组', 
      count: props.groupCounts[String(props.currentGroupId)] || 0 
    }
  }
}
</script>

<template>
  <!-- === 精致的工具栏 === -->
  <div class="glass-panel p-2 rounded-2xl space-y-4">
    <!-- 主要操作区 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <!-- 上传按钮重设计 -->
        <label for="upload-input" :class="['cursor-pointer', { 'pointer-events-none': isUploading }]">
          <input id="upload-input" type="file" multiple accept="image/*" class="hidden" @change="onInputChange" :disabled="isUploading" />
          <div :class="['btn-primary shadow-floating inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-10 px-4 py-2', { 'opacity-75': isUploading }]">
            <div v-if="isUploading" class="spinner h-4 w-4 mr-2"></div>
            <Upload v-else class="h-5 w-5 mr-2" />
            <span class="font-semibold">{{ isUploading ? '上传中...' : '上传素材' }}</span>
          </div>
        </label>
        
        <!-- AI 生成按钮 -->
        <Button 
          variant="outline" 
          @click="emit('openGenerate')" 
          :disabled="selected.size === 0"
          class="border-gradient"
          title="选择素材后点击生成"
        >
          <Sparkles class="h-4 w-4 mr-2" />
          <span class="font-semibold">AI 生成{{ selected.size > 0 ? ` (${selected.size})` : '' }}</span>
        </Button>
      </div>

      <!-- 右侧工具组 -->
      <div class="flex items-center gap-4">
        <!-- 当前分组状态 -->
        <div class="flex items-center gap-3 px-4 py-2 rounded-xl bg-[hsl(var(--surface-secondary))] border border-[hsl(var(--border-subtle))]">
          <div class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span class="text-sm font-medium text-[hsl(var(--text-primary))]">
            {{ getCurrentGroupInfo().name }}
          </span>
          <div class="badge-primary">
            {{ getCurrentGroupInfo().count }}
          </div>
        </div>

        <!-- 搜索框重设计 -->
        <div class="relative">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(var(--text-tertiary))]" />
          <Input 
            :model-value="searchQuery" 
            @update:model-value="emit('update:searchQuery', $event)"
            type="text" 
            placeholder="搜索你的创意素材..." 
            class="pl-12 pr-12 w-80 bg-[hsl(var(--surface-primary))] border-[hsl(var(--border-subtle))] focus:border-[hsl(var(--primary))] text-[hsl(var(--text-primary))]" 
          />
          <Button 
            v-if="searchQuery" 
            variant="ghost" 
            @click="clearSearch" 
            class="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-[hsl(var(--surface-secondary))] rounded-lg"
          >
            <X class="h-4 w-4" />
          </Button>
        </div>
        
        <!-- 视图切换重设计 -->
        <div class="segmented bg-[hsl(var(--surface-secondary))]">
          <Button variant="ghost" :class="['segmented-item', { 'is-active': viewMode === 'grid' }]" @click="emit('update:viewMode', 'grid')" title="网格视图">
            <Grid3X3 class="h-5 w-5" />
          </Button>
          <Button variant="ghost" :class="['segmented-item', { 'is-active': viewMode === 'list' }]" @click="emit('update:viewMode', 'list')" title="列表视图">
            <Grid class="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>

    <!-- 上传进度条 -->
    <div v-if="isUploading && uploadProgress" class="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800/30 animate-slide-in-from-top">
      <div class="flex items-center gap-3">
        <div class="spinner h-4 w-4 text-blue-600"></div>
        <span class="text-sm font-medium text-blue-700 dark:text-blue-300">{{ uploadProgress }}</span>
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
          <Select :model-value="moveTargetGroupIdStr" @update:model-value="moveTargetGroupIdStr = $event" class="min-w-[180px]">
            <SelectTrigger class="bg-[hsl(var(--surface-primary))] border-[hsl(var(--border-subtle))]">
              <SelectValue placeholder="移动到分组..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null">移动到：未分组</SelectItem>
              <SelectItem v-for="g in groups" :key="g.id" :value="String(g.id)">{{ g.name }}</SelectItem>
            </SelectContent>
          </Select>
          <Button @click="emit('moveSelectedToGroup')" class="btn-primary">
            <component :is="Folder" class="h-4 w-4 mr-2" />
            移动
          </Button>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="emit('clearSelection')" class="text-[hsl(var(--text-secondary))]">
          取消选择
        </Button>
        <Button variant="destructive" @click="emit('openBulkDelete')" class="btn-danger">
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
              <Select :model-value="sortBy" @update:model-value="emit('update:sortBy', $event)">
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
              <Select :model-value="sortOrder" @update:model-value="emit('update:sortOrder', $event)">
                <SelectTrigger><SelectValue placeholder="降序" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">降序</SelectItem>
                  <SelectItem value="asc">升序</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">每页显示</label>
              <Select :model-value="pageSizeStr" @update:model-value="pageSizeStr = $event">
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
</template>