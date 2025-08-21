<script setup lang="ts">
import { Grid3X3, Plus, Folder, AlertCircle, Pencil, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import type { GroupItem } from '@/types'

interface Props {
  groups: GroupItem[]
  currentGroupId: string | null
  groupCounts: Record<string, number>
  allCount: number
  UNASSIGNED: string
}

interface Emits {
  (e: 'selectGroup', groupId: string | null | typeof UNASSIGNED): void
  (e: 'createGroup'): void
  (e: 'renameGroup', group: GroupItem): void
  (e: 'deleteGroup', group: GroupItem): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function selectGroup(groupId: string | null | typeof props.UNASSIGNED) {
  emit('selectGroup', groupId)
}

function openCreateGroup() {
  emit('createGroup')
}

function openRenameGroup(g: GroupItem) {
  emit('renameGroup', g)
}

function openDeleteGroup(g: GroupItem) {
  emit('deleteGroup', g)
}
</script>

<template>
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
        @click="selectGroup(null)"
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
        @click="selectGroup(g.id)"
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
        @click="selectGroup(UNASSIGNED as any)"
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
</template>