<script setup lang="ts">
import { ref } from 'vue'
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose } from 'reka-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { GroupItem } from '@/types'

interface Props {
  createOpen: boolean
  renameOpen: boolean
  deleteOpen: boolean
  renameTarget: GroupItem | null
  deleteTarget: GroupItem | null
}

interface Emits {
  (e: 'update:createOpen', value: boolean): void
  (e: 'update:renameOpen', value: boolean): void
  (e: 'update:deleteOpen', value: boolean): void
  (e: 'createGroup', name: string): void
  (e: 'renameGroup', group: GroupItem, newName: string): void
  (e: 'deleteGroup', group: GroupItem): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const createName = ref('')
const renameName = ref('')

function submitCreateGroup() {
  const name = createName.value.trim()
  if (!name) return
  emit('createGroup', name)
  createName.value = ''
  emit('update:createOpen', false)
}

function submitRenameGroup() {
  const g = props.renameTarget
  const newName = renameName.value.trim()
  if (!g || !newName || newName === g.name) {
    emit('update:renameOpen', false)
    return
  }
  emit('renameGroup', g, newName)
  emit('update:renameOpen', false)
}

function submitDeleteGroup() {
  const g = props.deleteTarget
  if (!g) {
    emit('update:deleteOpen', false)
    return
  }
  emit('deleteGroup', g)
  emit('update:deleteOpen', false)
}

function onCreateOpenChange(open: boolean) {
  if (open) {
    createName.value = ''
  }
  emit('update:createOpen', open)
}

function onRenameOpenChange(open: boolean) {
  if (open && props.renameTarget) {
    renameName.value = props.renameTarget.name
  }
  emit('update:renameOpen', open)
}

function onDeleteOpenChange(open: boolean) {
  emit('update:deleteOpen', open)
}
</script>

<template>
  <!-- 分组：新建对话框 -->
  <DialogRoot :open="createOpen" @update:open="onCreateOpenChange">
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
  <DialogRoot :open="renameOpen" @update:open="onRenameOpenChange">
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
  <DialogRoot :open="deleteOpen" @update:open="onDeleteOpenChange">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <DialogContent class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[90vw] card-base p-4">
        <DialogTitle class="text-lg font-semibold mb-1">删除分组</DialogTitle>
        <DialogDescription class="text-sm text-[hsl(var(--muted-foreground))] mb-3">
          确定删除"{{ deleteTarget?.name }}"？组内图片将变为未分组。
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
</template>