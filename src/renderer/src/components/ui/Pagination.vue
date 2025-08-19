<script setup lang="ts">
import { 
  PaginationEllipsis, 
  PaginationFirst, 
  PaginationLast, 
  PaginationList, 
  PaginationListItem, 
  PaginationNext, 
  PaginationPrev, 
  PaginationRoot 
} from 'reka-ui'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  page: number
  pageCount: number
  siblingCount?: number
  showEdges?: boolean
  disabled?: boolean
  itemsPerPage?: number
  total?: number
}>(), {
  siblingCount: 1,
  showEdges: false,
  disabled: false,
  itemsPerPage: 24,
  total: 0,
})

const emit = defineEmits<{
  (e: 'update:page', value: number): void
}>()

// 使用 computed 来处理双向绑定
const currentPage = computed({
  get: () => props.page,
  set: (value: number) => emit('update:page', value)
})
</script>

<template>
  <PaginationRoot
    v-model:page="currentPage"
    :total="total || pageCount * itemsPerPage"
    :items-per-page="itemsPerPage"
    :sibling-count="siblingCount"
    :show-edges="showEdges"
    :disabled="disabled"
    class="flex items-center justify-center"
  >
    <PaginationList v-slot="{ items }" class="flex items-center gap-1">
      <!-- 首页按钮 -->
      <PaginationFirst
        v-if="showEdges"
        class="btn-outline !px-3 !py-1.5 hover:bg-[hsl(var(--accent))] transition-colors"
      >
        首页
      </PaginationFirst>
      
      <!-- 上一页按钮 -->
      <PaginationPrev class="btn-outline !px-3 !py-1.5 hover:bg-[hsl(var(--accent))] transition-colors">
        上一页
      </PaginationPrev>

      <!-- 页码和省略号 -->
      <template v-for="(page, index) in items" :key="index">
        <PaginationListItem
          v-if="page.type === 'page'"
          :value="page.value"
          class="btn-outline !px-3 !py-1.5 hover:bg-[hsl(var(--accent))] transition-colors"
          :class="{ 'btn-primary': page.value === currentPage }"
        >
          {{ page.value }}
        </PaginationListItem>
        
        <PaginationEllipsis
          v-else
          :key="page.type"
          :index="index"
          class="px-2 text-[hsl(var(--muted-foreground))]"
        >
          &#8230;
        </PaginationEllipsis>
      </template>

      <!-- 下一页按钮 -->
      <PaginationNext class="btn-outline !px-3 !py-1.5 hover:bg-[hsl(var(--accent))] transition-colors">
        下一页
      </PaginationNext>
      
      <!-- 末页按钮 -->
      <PaginationLast
        v-if="showEdges"
        class="btn-outline !px-3 !py-1.5 hover:bg-[hsl(var(--accent))] transition-colors"
      >
        末页
      </PaginationLast>
    </PaginationList>
  </PaginationRoot>
</template>

<style scoped></style>

