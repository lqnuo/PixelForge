<script setup lang="ts">
import { ref, onMounted } from 'vue'

const bridge: any = (window as any)?.api

const apiKey = ref('')
const endpoint = ref('')
const model = ref('')
const saving = ref(false)
const savedHint = ref('')

async function load() {
  try {
    const all = (await bridge?.config?.getAll?.()) || {}
    apiKey.value = all['dashscope_api_key'] || ''
    endpoint.value = all['dashscope_endpoint'] || 'https://dashscope.aliyuncs.com/api/v1/services/images/editing'
    model.value = all['dashscope_model'] || 'qwen-vl-plus'
  } catch {}
}

async function save() {
  if (!bridge?.config) return
  saving.value = true
  try {
    await bridge.config.set('dashscope_api_key', apiKey.value.trim())
    await bridge.config.set('dashscope_endpoint', endpoint.value.trim())
    await bridge.config.set('dashscope_model', model.value.trim())
    savedHint.value = '已保存'
    setTimeout(() => (savedHint.value = ''), 1500)
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="toolbar flex items-center justify-between">
      <div class="text-base font-semibold">设置</div>
      <div class="text-xs text-[hsl(var(--muted-foreground))]">配置阿里云灵积（DashScope）API</div>
    </div>

    <div class="flex-1 overflow-auto p-6 space-y-6 max-w-3xl">
      <div class="card p-5 space-y-3">
        <div class="font-medium">DashScope 配置</div>
        <label class="flex flex-col gap-1">
          <span class="text-sm text-[hsl(var(--muted-foreground))]">API Key</span>
          <input v-model="apiKey" type="password" placeholder="sk-..." class="input" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-sm text-[hsl(var(--muted-foreground))]">Endpoint</span>
          <input v-model="endpoint" type="text" class="input" />
          <span class="text-xs text-[hsl(var(--muted-foreground))]">默认：https://dashscope.aliyuncs.com/api/v1/services/images/editing</span>
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-sm text-[hsl(var(--muted-foreground))]">Model</span>
          <input v-model="model" type="text" class="input" />
          <span class="text-xs text-[hsl(var(--muted-foreground))]">示例：qwen-vl-plus（可根据控制台实际模型调整）</span>
        </label>
        <div class="flex items-center gap-3 pt-2">
          <button class="btn" :disabled="saving" @click="save">保存</button>
          <span v-if="savedHint" class="text-xs text-green-600">{{ savedHint }}</span>
        </div>
      </div>

      <div class="text-xs text-[hsl(var(--muted-foreground))]">
        提示：保存后，生成任务将使用该配置通过“图像编辑（扩图）”API处理。若缺少 Key 或调用失败，任务会标记为失败。
      </div>
    </div>
  </div>
</template>

<style scoped>
.card { @apply rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]; }
.input { @apply h-9 px-3 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))]; }
.btn { @apply inline-flex items-center px-3 py-2 rounded-md bg-[hsl(var(--primary))] text-white hover:opacity-90; }
.toolbar { @apply h-12 px-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]; }
</style>

