<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { toast } from 'vue-sonner'
import { ShieldAlert, ShieldCheck, Copy, Check, ClipboardPaste, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

type LicenseStatus = { valid: boolean; reason?: string; payload?: any }

const api: any = (window as any)?.api

const deviceCode = ref<string>('')
const token = ref<string>('')
const status = ref<LicenseStatus | null>(null)
const copied = ref(false)
const pasting = ref(false)
const activating = ref(false)

const canUseBridge = computed(() => !!api?.license)

async function loadStatus() {
  try {
    if (canUseBridge.value) {
      deviceCode.value = (await api.license.getDeviceCode()) || ''
      status.value = await api.license.getStatus()
    } else {
      // 占位：无 IPC 时给出演示状态
      deviceCode.value = 'DEMO-DEVICE-CODE'
      status.value = { valid: false, reason: 'missing_ipc' }
    }
  } catch (e) {
    status.value = { valid: false, reason: 'unknown_error' }
  }
}

onMounted(loadStatus)

async function copyDeviceCode() {
  try {
    await navigator.clipboard.writeText(deviceCode.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1200)
  } catch {
    toast.error('复制失败，请手动选择复制')
  }
}

async function pasteFromClipboard() {
  try {
    pasting.value = true
    const text = await navigator.clipboard.readText()
    if (text) token.value = text.trim()
  } catch {
    toast.error('读取剪贴板失败')
  } finally {
    pasting.value = false
  }
}

async function activate() {
  if (!token.value.trim()) {
    toast.warning('请粘贴激活码')
    return
  }
  if (!canUseBridge.value) {
    toast.error('当前构建未接入激活 IPC')
    return
  }
  try {
    activating.value = true
    const res = await api.license.activate(token.value.trim())
    if (res?.ok) {
      toast.success('激活成功')
      await loadStatus()
    } else {
      toast.error(res?.message || '激活失败')
    }
  } catch {
    toast.error('激活请求失败')
  } finally {
    activating.value = false
  }
}
</script>

<template>
  <div class="h-full w-full flex items-center justify-center bg-[hsl(var(--background))] p-6">
    <div class="w-full max-w-4xl grid grid-cols-1 md:grid-cols-5 gap-6">
      <!-- 左侧：状态与设备码 -->
      <Card class="md:col-span-2 border-[hsl(var(--border-subtle))]">
        <CardHeader>
          <div class="flex items-center gap-2">
            <ShieldAlert class="h-5 w-5 text-amber-500" />
            <CardTitle>应用未激活</CardTitle>
          </div>
          <CardDescription>
            请复制设备码并在授权门户获取激活码。
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div>
            <div class="text-xs text-[hsl(var(--text-tertiary))] mb-2">设备码</div>
            <div class="flex items-center gap-2">
              <div
                class="font-mono text-sm flex-1 px-3 py-2 rounded-md bg-[hsl(var(--surface-secondary))]/50 border border-[hsl(var(--border-subtle))] break-all"
              >
                {{ deviceCode || '加载中…' }}
              </div>
              <Button variant="outline" class="shrink-0" @click="copyDeviceCode">
                <component :is="copied ? Check : Copy" class="h-4 w-4" />
                <span class="ml-1">{{ copied ? '已复制' : '复制' }}</span>
              </Button>
            </div>
          </div>

          <div class="rounded-md border p-3 text-xs text-[hsl(var(--text-secondary))] bg-[hsl(var(--surface-secondary))]/40">
            - 访问授权门户，登录后粘贴设备码申请激活码。
            <br />
            - 激活码与此设备码绑定，仅限本机使用。
          </div>

          <div v-if="status && !status.valid" class="text-xs text-amber-600">
            当前状态：{{ status.reason }}
          </div>
        </CardContent>
      </Card>

      <!-- 右侧：激活操作 -->
      <Card class="md:col-span-3 border-[hsl(var(--border-subtle))]">
        <CardHeader>
          <div class="flex items-center gap-2">
            <ShieldCheck class="h-5 w-5 text-emerald-500" />
            <CardTitle>导入激活码</CardTitle>
          </div>
          <CardDescription>粘贴门户获取的激活令牌，完成授权。</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <textarea
            v-model="token"
            class="w-full h-40 rounded-md border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface-secondary))]/40 p-3 text-sm font-mono outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30"
            placeholder="粘贴激活码（格式形如：base64url(payload).base64url(signature)）"
          />
          <div class="flex items-center gap-2 justify-between">
            <div class="text-xs text-[hsl(var(--text-tertiary))]">
              支持离线激活，激活信息仅保存在本机。
            </div>
            <div class="flex items-center gap-2">
              <Button variant="outline" @click="pasteFromClipboard" :disabled="pasting">
                <component :is="pasting ? Loader2 : ClipboardPaste" class="h-4 w-4 animate-spin" :class="{ 'opacity-60': pasting }" />
                <span class="ml-1">粘贴</span>
              </Button>
              <Button @click="activate" :disabled="activating">
                <component :is="activating ? Loader2 : ShieldCheck" class="h-4 w-4" :class="{ 'animate-spin': activating }" />
                <span class="ml-1">{{ activating ? '激活中…' : '立即激活' }}</span>
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter class="justify-between text-xs text-[hsl(var(--text-tertiary))]">
          <span>如果反复失败，请联系技术支持并提供设备码。</span>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

