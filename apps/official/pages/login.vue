<template>
  <UContainer class="py-12 md:py-20 max-w-lg">
    <UCard>
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold">登录</h1>
          <p class="text-gray-500 text-sm mt-1">邮箱验证码登录（无密码）</p>
        </div>
      </template>
      <UForm :state="state" @submit="onVerify">
        <UFormField label="邮箱" name="email">
          <UInput v-model="state.email" type="email" placeholder="you@example.com" required class="w-full" />
        </UFormField>

        <div class="flex items-center gap-2 mt-2">
          <UButton :loading="sending" :disabled="!state.email || sending || countdown>0" @click="onSend" class="flex-1">
            {{ countdown>0 ? `重新发送 (${countdown}s)` : '发送验证码' }}
          </UButton>
        </div>

        <UFormField v-if="sent" label="验证码" name="otp" class="mt-4">
          <UInput v-model="state.otp" inputmode="numeric" pattern="[0-9]*" placeholder="6位数字验证码" required class="w-full" />
        </UFormField>

        <UButton v-if="sent" type="submit" block class="w-full mt-4" :loading="verifying" :disabled="!state.otp">
          登录
        </UButton>
      </UForm>
      <template #footer>
        <div class="text-center text-sm text-gray-500">
          没有账号？直接登录即可，我们会自动帮你创建账号
        </div>
      </template>
    </UCard>
  </UContainer>
  <UNotifications />
</template>

<script setup lang="ts">
const state = reactive({ email: '', otp: '' })
const sent = ref(false)
const sending = ref(false)
const verifying = ref(false)
const countdown = ref(0)
let timer: any

onBeforeUnmount(() => clearInterval(timer))

const { $auth } = useNuxtApp() as any

async function onSend() {
  if (!state.email) return
  sending.value = true
  try {
    const res = await $auth.emailOtp.sendVerificationOtp({ email: state.email, type: 'sign-in' })
    if (res?.error) throw res.error
    sent.value = true
    startCountdown(60)
    useToast().add({ title: '验证码已发送', description: '请检查邮箱并输入验证码', color: 'primary' })
  } catch (e: any) {
    useToast().add({ title: '发送失败', description: e?.data?.message || e?.message || '请稍后再试', color: 'red' })
  } finally {
    sending.value = false
  }
}

async function onVerify() {
  if (!state.email || !state.otp) return
  verifying.value = true
  try {
    const res = await $auth.signIn.emailOtp({ email: state.email, otp: state.otp })
    if (res?.error) throw res.error
    useToast().add({ title: '登录成功', color: 'primary' })
    await navigateTo('/')
  } catch (e: any) {
    useToast().add({ title: '登录失败', description: e?.data?.message || e?.message || '请检查验证码是否正确', color: 'red' })
  } finally {
    verifying.value = false
  }
}

function startCountdown(sec: number) {
  clearInterval(timer)
  countdown.value = sec
  timer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) clearInterval(timer)
  }, 1000)
}
</script>
