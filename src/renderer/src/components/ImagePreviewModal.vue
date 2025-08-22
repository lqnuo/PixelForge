<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import type { ImageItem } from '@/types'
import { dataUrl, formatFileSize, formatDate } from '@/utils/image'

interface Props {
  show: boolean
  image: ImageItem | null
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function close() {
  emit('close')
}
</script>

<template>
  <!-- === 图片预览模态框 === -->
  <Teleport to="body">
    <div
      v-if="show && image"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      @click="close"
    >
      <div class="relative max-w-4xl max-h-[90vh] m-4" @click.stop>
        <img
          :src="dataUrl(image.mimeType, image.previewBase64)"
          :alt="image.filename || image.id"
          class="max-w-full max-h-full rounded-xl shadow-dramatic"
        />
        <Button
          variant="ghost"
          @click="close"
          class="absolute -top-4 -right-4 p-2 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
        >
          <X class="h-6 w-6" />
        </Button>
        
        <!-- 图片信息 -->
        <div class="absolute bottom-0 left-0 right-0 bg-black/60 p-6 rounded-b-xl text-white">
          <h3 class="font-semibold text-lg mb-2">{{ image.filename || image.id }}</h3>
          <div class="flex items-center gap-4 text-sm text-white/80">
            <span>{{ formatFileSize(image.sizeBytes) }}</span>
            <span v-if="image.createdAt">{{ formatDate(image.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>