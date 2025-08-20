<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

const bridge: any = (window as any)?.api

const providers = ['qwen', 'openai', 'deepseek'] as const
type Provider = (typeof providers)[number]

const active = ref<Provider>('qwen')
const saving = ref(false)
const savedHint = ref('')

const form = reactive({
  qwen: {
    apiKey: '',
    endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/images/editing',
    model: 'qwen-image-edit'
  },
  openai: {
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    imageModel: 'gpt-image-1'
  },
  deepseek: {
    apiKey: '',
    baseUrl: 'https://api.deepseek.com/v1',
    imageModel: 'deepseek-image'
  }
})

// 预设可选模型（占位，不发请求）
const modelOptions: Record<Provider, Array<{ label: string; value: string }>> = {
  qwen: [
    { label: 'qwen-image-edit', value: 'qwen-image-edit' },
    { label: 'qwen-vl-plus', value: 'qwen-vl-plus' },
    { label: 'qwen-vl-max', value: 'qwen-vl-max' },
    { label: 'qwen-vl-turbo', value: 'qwen-vl-turbo' }
  ],
  openai: [
    { label: 'gpt-image-1', value: 'gpt-image-1' },
    { label: 'dall-e-3', value: 'dall-e-3' }
  ],
  deepseek: [
    { label: 'deepseek-image', value: 'deepseek-image' },
    { label: 'deepseek-vl', value: 'deepseek-vl' }
  ]
}

const titles: Record<Provider, string> = {
  qwen: 'Qwen / DashScope 配置',
  openai: 'OpenAI 配置',
  deepseek: 'DeepSeek 配置'
}

async function load() {
  try {
    const all = (await bridge?.config?.getAll?.()) || {}
    // Qwen
    form.qwen.apiKey = all['dashscope_api_key'] || ''
    form.qwen.endpoint =
      all['dashscope_endpoint'] || 'https://dashscope.aliyuncs.com/api/v1/services/images/editing'
    form.qwen.model = all['dashscope_model'] || 'qwen-image-edit'
    // OpenAI
    form.openai.apiKey = all['openai_api_key'] || ''
    form.openai.baseUrl = all['openai_base_url'] || 'https://api.openai.com/v1'
    form.openai.imageModel = all['openai_image_model'] || 'gpt-image-1'
    // DeepSeek
    form.deepseek.apiKey = all['deepseek_api_key'] || ''
    form.deepseek.baseUrl = all['deepseek_base_url'] || 'https://api.deepseek.com/v1'
    form.deepseek.imageModel = all['deepseek_image_model'] || 'deepseek-image'
  } catch {}
}

async function save() {
  if (!bridge?.config) return
  saving.value = true
  savedHint.value = ''
  try {
    if (active.value === 'qwen') {
      await bridge.config.set('dashscope_api_key', String(form.qwen.apiKey || '').trim())
      await bridge.config.set('dashscope_endpoint', String(form.qwen.endpoint || '').trim())
      await bridge.config.set('dashscope_model', String(form.qwen.model || '').trim())
    } else if (active.value === 'openai') {
      await bridge.config.set('openai_api_key', String(form.openai.apiKey || '').trim())
      await bridge.config.set('openai_base_url', String(form.openai.baseUrl || '').trim())
      await bridge.config.set('openai_image_model', String(form.openai.imageModel || '').trim())
    } else if (active.value === 'deepseek') {
      await bridge.config.set('deepseek_api_key', String(form.deepseek.apiKey || '').trim())
      await bridge.config.set('deepseek_base_url', String(form.deepseek.baseUrl || '').trim())
      await bridge.config.set('deepseek_image_model', String(form.deepseek.imageModel || '').trim())
    }
    savedHint.value = '已保存'
    toast.success('保存成功')
    setTimeout(() => (savedHint.value = ''), 1500)
  } catch (e) {
    toast.error('保存失败，请重试')
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
    </div>

    <div class="flex-1 overflow-hidden">
      <div class="h-full grid" style="grid-template-columns: 220px 1fr;">
        <!-- 左侧 Provider Tabs -->
        <aside class="border-r bg-[hsl(var(--card))] p-2">
          <div class="text-xs font-semibold text-[hsl(var(--muted-foreground))] px-2 py-2">模型供应商</div>
          <div class="space-y-1">
            <button
              v-for="p in providers"
              :key="p"
              :class="[
                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                active === p ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--foreground))] border border-[hsl(var(--primary))]/30' : 'hover:bg-[hsl(var(--muted))]/50'
              ]"
              @click="active = p"
            >
              <span class="inline-block h-2 w-2 rounded-full" :class="active === p ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--border))]'"></span>
              <span class="capitalize">{{ p }}</span>
            </button>
          </div>
        </aside>

        <!-- 右侧 表单内容 -->
        <section class="overflow-auto p-6 space-y-6">
          <div class="card p-5 space-y-4 max-w-3xl">
            <div class="font-medium">{{ titles[active] }}</div>

            <!-- Qwen Form -->
            <template v-if="active === 'qwen'">
              <label class="flex flex-col gap-1">
                <span class="text-sm text-[hsl(var(--muted-foreground))]">API Key</span>
                <Input v-model="form.qwen.apiKey" type="password" placeholder="sk-..." />
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-sm text-[hsl(var(--muted-foreground))]">Endpoint</span>
                <Input v-model="form.qwen.endpoint" type="text" />
                <span class="text-xs text-[hsl(var(--muted-foreground))]">默认：https://dashscope.aliyuncs.com/api/v1/services/images/editing</span>
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-sm text-[hsl(var(--muted-foreground))]">Model</span>
                <Select v-model="form.qwen.model">
                  <SelectTrigger><SelectValue placeholder="选择模型" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="opt in modelOptions.qwen" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            </template>

            <!-- OpenAI Form -->
            <template v-else-if="active === 'openai'">
              <label class="flex flex-col gap-1">
                <span class="text-sm text-[hsl(var(--muted-foreground))]">API Key</span>
                <Input v-model="form.openai.apiKey" type="password" placeholder="sk-..." />
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-sm text-[hsl(var(--muted-foreground))]">Base URL</span>
                <Input v-model="form.openai.baseUrl" type="text" />
                <span class="text-xs text-[hsl(var(--muted-foreground))]">默认：https://api.openai.com/v1（如走代理可改为自定义网关）</span>
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-sm text-[hsl(var(--muted-foreground))]">Image Model</span>
                <Select v-model="form.openai.imageModel">
                  <SelectTrigger><SelectValue placeholder="选择模型" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="opt in modelOptions.openai" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            </template>

            <!-- DeepSeek Form -->
            <template v-else>
              <label class="flex flex-col gap-1">
                <span class="text-sm text-[hsl(var(--muted-foreground))]">API Key</span>
                <Input v-model="form.deepseek.apiKey" type="password" placeholder="sk-..." />
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-sm text-[hsl(var(--muted-foreground))]">Base URL</span>
                <Input v-model="form.deepseek.baseUrl" type="text" />
                <span class="text-xs text-[hsl(var(--muted-foreground))]">默认：https://api.deepseek.com/v1</span>
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-sm text-[hsl(var(--muted-foreground))]">Image Model</span>
                <Select v-model="form.deepseek.imageModel">
                  <SelectTrigger><SelectValue placeholder="选择模型" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="opt in modelOptions.deepseek" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            </template>

            <div class="flex items-center gap-3 pt-2">
              <Button :disabled="saving" @click="save">
                {{ saving ? '保存中…' : '保存当前 Tab' }}
              </Button>
              <span v-if="savedHint" class="text-xs text-green-600">{{ savedHint }}</span>
            </div>
          </div>

          <div class="text-xs text-[hsl(var(--muted-foreground))]">
            说明：这里只做多家模型的配置管理（不发起任何请求）。后续需要时可在任务执行里按所选供应商读取对应配置。
          </div>
        </section>
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
