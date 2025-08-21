<script setup lang="ts">
import { computed } from 'vue'
import { AlertCircle, Upload, Eye, Download, MoreVertical, Check } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationFirst, PaginationLast, PaginationNext, PaginationPrevious, PaginationItem } from '@/components/ui/pagination'
import type { ImageItem } from '@/types'
import { dataUrl, formatFileSize, formatDate } from '@/utils/image'

interface Props {
  pageItems: ImageItem[]
  viewMode: 'grid' | 'list'
  searchQuery: string
  selected: Set<string>
  page: number
  pageSize: number
  total: number
  isDragging: boolean
}

interface Emits {
  (e: 'toggle', id: string, checked: boolean): void
  (e: 'toggleAllOnPage', checked: boolean): void
  (e: 'preview', image: ImageItem): void
  (e: 'contextMenu', event: MouseEvent, item: ImageItem): void
  (e: 'drop', event: DragEvent): void
  (e: 'dragEnter'): void
  (e: 'dragLeave'): void
  (e: 'upload', event: Event): void
  (e: 'update:page', page: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

function isChecked(id: string) {
  return props.selected.has(id)
}

function onInputChange(evt: Event) {
  emit('upload', evt)
}
</script>

<template>
  <!-- 状态栏 -->
  <div class="flex items-center justify-between p-2 bg-[hsl(var(--surface-secondary))]/50 rounded-xl border border-[hsl(var(--border-subtle))]">
    <div class="flex items-center gap-4">
      <span class="text-[hsl(var(--text-primary))] font-medium">{{ total }} 个素材</span>
      <span v-if="searchQuery" class="text-[hsl(var(--text-secondary))]">搜索: "{{ searchQuery }}"</span>
    </div>
    
    <div class="flex items-center gap-3">
      <label class="flex items-center gap-2 cursor-pointer hover:text-[hsl(var(--text-primary))] transition-colors">
        <input type="checkbox" @change="(e:any)=>emit('toggleAllOnPage', e.target.checked)" class="rounded" />
        <span class="text-sm">本页全选</span>
      </label>
    </div>
  </div>

  <!-- 素材网格 -->
  <div class="flex-1 overflow-auto mt-4">
    <div 
      v-if="viewMode === 'grid'"
      class="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 animate-fade-in"
      @dragover.prevent="emit('dragEnter')"
      @dragenter.prevent="emit('dragEnter')"
      @dragleave="emit('dragLeave')"
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
        @click="emit('preview', item)"
        @contextmenu.prevent="emit('contextMenu', $event, item)"
      >
        <!-- 选择框 -->
        <label class="absolute top-3 left-3 z-10 cursor-pointer" @click.stop>
          <input
            type="checkbox"
            :checked="isChecked(item.id)"
            @change="(e:any)=>emit('toggle', item.id, e.target.checked)"
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
    <Pagination :page="page" @update:page="emit('update:page', $event)" :total="total" :items-per-page="pageSize" :sibling-count="1" :show-edges="pageCount > 7">
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
</template>