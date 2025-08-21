<script setup lang="ts">
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose } from 'reka-ui'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  selectedCount: number
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'confirm'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function onOpenChange(open: boolean) {
  emit('update:open', open)
}

function handleConfirm() {
  emit('confirm')
}
</script>

<template>
  <!-- 批量删除确认对话框 -->
  <DialogRoot :open="open" @update:open="onOpenChange">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <DialogContent class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-w-[90vw] card-base p-4">
        <DialogTitle class="text-lg font-semibold mb-1">删除所选素材</DialogTitle>
        <DialogDescription class="text-sm text-[hsl(var(--muted-foreground))] mb-3">
          将删除选中的 {{ selectedCount }} 张图片及其关联的任务与结果，且不可恢复。
        </DialogDescription>
        <div class="flex items-center justify-end gap-2 mt-2">
          <DialogClose as-child>
            <Button variant="outline">取消</Button>
          </DialogClose>
          <Button variant="destructive" @click="handleConfirm">删除</Button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>