<script setup lang="ts">
import { computed } from 'vue'
import { Sparkles } from 'lucide-vue-next'
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose } from 'reka-ui'
import { Button } from '@/components/ui/button'
import type { ModelItem, PromptItem } from '@/types'

interface Props {
  open: boolean
  isGenerating: boolean
  models: ModelItem[]
  prompts: PromptItem[]
  selectedModelKey: string | null
  selectedPromptId: string | null
  aspect: '1:1' | '3:4'
  selectedCount: number
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'update:selectedModelKey', value: string | null): void
  (e: 'update:selectedPromptId', value: string | null): void
  (e: 'update:aspect', value: '1:1' | '3:4'): void
  (e: 'generate'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const canGenerate = computed(() => 
  props.selectedModelKey && props.selectedPromptId && !props.isGenerating
)

function selectModel(key: string) {
  emit('update:selectedModelKey', key)
}

function selectPrompt(id: string) {
  emit('update:selectedPromptId', id)
}

function selectAspect(aspect: '1:1' | '3:4') {
  emit('update:aspect', aspect)
}

function handleGenerate() {
  emit('generate')
}

function onOpenChange(open: boolean) {
  emit('update:open', open)
}
</script>

<template>
  <!-- === 生成确认弹窗（Reka UI Dialog） === -->
  <DialogRoot :open="open" @update:open="onOpenChange">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <DialogContent class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] max-w-[90vw] max-h-[85vh] card-base p-6 flex flex-col overflow-hidden">
        <DialogTitle class="text-lg font-semibold mb-1">选择模型与提示语</DialogTitle>
        <DialogDescription class="text-sm text-[hsl(var(--muted-foreground))] mb-6">
          请选择要使用的AI模型和处理提示语，两项都必须选择才能开始生成。
        </DialogDescription>

        <!-- Scrollable body -->
        <div class="flex-1 overflow-y-auto pr-1 space-y-6">
          <!-- 模型选择 -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <div class="text-sm font-medium">AI 模型</div>
              <div class="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-2 py-1 rounded">
                需要配置API密钥才可选择
              </div>
            </div>
            <div class="space-y-2">
              <Button
                v-for="model in models"
                :key="model.key"
                :variant="selectedModelKey === model.key ? 'default' : 'outline'"
                :disabled="!model.available"
                @click="selectModel(model.key)"
                class="w-full justify-start p-4 h-auto"
              >
                <div class="flex items-center justify-between w-full">
                  <div class="text-left">
                    <div class="font-medium">{{ model.name }}</div>
                    <div class="text-xs opacity-70 capitalize">{{ model.provider }}</div>
                  </div>
                  <div v-if="!model.available" class="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-2 py-1 rounded">
                    未配置
                  </div>
                  <div v-else class="text-xs text-green-600 bg-green-100 px-2 py-1 rounded dark:text-green-400 dark:bg-green-900">
                    已配置
                  </div>
                </div>
              </Button>
              <div v-if="models.filter(m => m.available).length === 0" class="text-center py-4 text-[hsl(var(--muted-foreground))]">
                <div class="text-sm">暂无可用模型</div>
                <div class="text-xs mt-1">请先在设置中配置API密钥</div>
              </div>
            </div>
          </div>

          <!-- 提示语选择 -->
          <div>
            <div class="text-sm font-medium mb-3">处理提示语</div>
            <div class="space-y-2">
              <Button
                v-for="prompt in prompts"
                :key="prompt.id"
                :variant="selectedPromptId === prompt.id ? 'default' : 'outline'"
                @click="selectPrompt(prompt.id)"
                class="w-full justify-start p-4 h-auto"
              >
                <div class="text-left w-full">
                  <div class="font-medium">{{ prompt.name }}</div>
                  <div v-if="prompt.description" class="text-xs opacity-70 mt-1">{{ prompt.description }}</div>
                </div>
              </Button>
            </div>
          </div>

          <!-- 尺寸选择 -->
          <div>
            <div class="text-sm font-medium mb-3">输出尺寸</div>
            <div class="segmented">
              <Button variant="ghost" :class="['segmented-item', { 'is-active': aspect === '1:1' }]" @click="selectAspect('1:1')">1:1 正方形</Button>
              <Button variant="ghost" :class="['segmented-item', { 'is-active': aspect === '3:4' }]" @click="selectAspect('3:4')">3:4 竖版</Button>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t mt-6">
          <DialogClose as-child>
            <Button variant="outline">取消</Button>
          </DialogClose>
          <Button 
            :disabled="!canGenerate" 
            @click="handleGenerate"
            class="min-w-[120px]"
          >
            <span v-if="isGenerating" class="spinner mr-2"></span>
            <Sparkles v-else class="w-4 h-4 mr-2" />
            {{ isGenerating ? '生成中...' : '开始生成' }}
          </Button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>

</template>