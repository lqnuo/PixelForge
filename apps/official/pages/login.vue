<template>
  <UContainer class="py-12 md:py-20 max-w-lg">
    <UCard>
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold">登录</h1>
          <p class="text-gray-500 text-sm mt-1">使用邮箱登录到 PixelForge</p>
        </div>
      </template>
      <UForm :state="state" @submit="onSubmit" class="space-y-4">
        <UFormGroup label="邮箱" name="email">
          <UInput v-model="state.email" type="email" placeholder="you@example.com" required />
        </UFormGroup>
        <UFormGroup label="密码" name="password">
          <UInput v-model="state.password" type="password" placeholder="••••••••" required />
        </UFormGroup>
        <UButton type="submit" block>登录</UButton>
      </UForm>
      <template #footer>
        <div class="text-center text-sm text-gray-500">
          还没有账号？<NuxtLink to="/signup" class="underline">注册</NuxtLink>
        </div>
      </template>
    </UCard>
  </UContainer>
  </template>

<script setup lang="ts">
const state = reactive({ email: '', password: '' })
function onSubmit() {
  alert(`登录占位：\n邮箱：${state.email}`)
}
</script>
