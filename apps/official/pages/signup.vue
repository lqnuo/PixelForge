<template>
  <UContainer class="py-12 md:py-20 max-w-lg">
    <UCard>
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold">注册 / 购买会员</h1>
          <p class="text-gray-500 text-sm mt-1">创建账号，解锁专业功能</p>
        </div>
      </template>
      <UForm :state="state" @submit="onSubmit" class="space-y-4">
        <UFormGroup label="邮箱" name="email">
          <UInput v-model="state.email" type="email" placeholder="you@example.com" required />
        </UFormGroup>
        <UFormGroup label="密码" name="password">
          <UInput v-model="state.password" type="password" placeholder="至少 8 位" required />
        </UFormGroup>
        <UFormGroup label="套餐" name="plan">
          <USelect v-model="state.plan" :options="plans" />
        </UFormGroup>
        <UButton type="submit" block>创建并开通</UButton>
      </UForm>
      <template #footer>
        <div class="text-center text-sm text-gray-500">
          已有账号？<NuxtLink to="/login" class="underline">登录</NuxtLink>
        </div>
      </template>
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
const plans = [
  { label: '入门（免费）', value: 'free' },
  { label: '专业 ¥39/月', value: 'pro' },
  { label: '团队 ¥99/月', value: 'team' }
]
const state = reactive({ email: '', password: '', plan: 'pro' })
function onSubmit() {
  alert(`注册占位：\\n邮箱：${state.email}\\n套餐：${state.plan}`)
}
</script>

