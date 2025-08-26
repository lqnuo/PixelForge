<template>
  <div class="max-w-md mx-auto">
    <UCard>
      <template #header>
        <div class="space-y-1">
          <div class="text-lg font-semibold">登录</div>
          <p class="text-sm text-gray-500">仅支持邮件验证码登录（better-auth）</p>
        </div>
      </template>

      <div class="space-y-4">
        <UAlert
          v-if="!redirectUri"
          color="yellow"
          title="提示"
          description="未提供 redirect_uri。Electron 客户端可传入 pixelforge://auth/callback。"
        />

        <UForm :state="form" @submit.prevent="step === 1 ? sendCode() : verifyCode()" class="space-y-4">
          <UFormGroup label="邮箱" name="email">
            <UInput v-model="form.email" type="email" placeholder="you@example.com" :disabled="step===2 || loading" />
          </UFormGroup>

          <transition name="fade">
            <div v-if="step===2" class="space-y-2">
              <UFormGroup label="验证码" name="code">
                <UInput v-model="form.code" placeholder="6位验证码" maxlength="6" :disabled="loading" />
              </UFormGroup>
              <div class="text-xs text-gray-500">验证码已发送到邮箱，如未收到请检查垃圾箱。</div>
            </div>
          </transition>

          <UButton type="submit" color="primary" class="w-full" :loading="loading">
            {{ step === 1 ? '发送验证码' : '验证并登录' }}
          </UButton>

          <UDivider label="或" />
          <UButton color="gray" variant="soft" class="w-full" @click="devLogin">开发模式登录（本地调试）</UButton>
        </UForm>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const loading = ref(false)
const step = ref<1 | 2>(1)
const form = reactive({ email: '', code: '' })
const redirectUri = computed(() => String(route.query.redirect_uri || ''))

function toRedirect(url: string) {
  const ru = redirectUri.value
  if (ru) {
    // Redirect back to Electron with token
    window.location.href = `${ru}${ru.includes('?') ? '&' : '?'}token=${encodeURIComponent(url)}`
  } else {
    router.push('/')
  }
}

async function devLogin() {
  loading.value = true
  try {
    // TODO: replace with better-auth signIn, then call toRedirect(token)
    const token = `dev-token-${Math.random().toString(36).slice(2)}`
    toRedirect(token)
  } finally {
    loading.value = false
  }
}

async function sendCode() {
  if (!form.email) return
  loading.value = true
  try {
    await $fetch('/api/auth/otp.send', { method: 'POST', body: { email: form.email, redirect_uri: redirectUri.value || undefined } })
    step.value = 2
  } catch (e) {
    // noop: could show toast
  } finally {
    loading.value = false
  }
}

async function verifyCode() {
  if (!form.email || !form.code) return
  loading.value = true
  try {
    // If redirect_uri is provided, server will redirect with token
    if (redirectUri.value) {
      const res = await $fetch.raw('/api/auth/otp.verify', { method: 'POST', body: { email: form.email, code: form.code, redirect_uri: redirectUri.value } })
      // If Nitro handled redirect, the browser will navigate; otherwise, fallback
      if (res.redirected && res.url) {
        window.location.href = res.url
      }
    } else {
      const { session } = await $fetch<{ ok: boolean; session: any }>('/api/auth/otp.verify', { method: 'POST', body: { email: form.email, code: form.code } })
      if (session?.token) toRedirect(session.token)
      else router.push('/')
    }
  } catch (e) {
    // noop: could show toast
  } finally {
    loading.value = false
  }
}
</script>
