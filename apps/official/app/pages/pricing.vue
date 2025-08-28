<template>
  <section>
    <UContainer class="py-12 md:py-20">
      <div class="text-center mb-10">
        <h1 class="text-3xl md:text-4xl font-bold">定价</h1>
        <p class="text-gray-500 mt-2">灵活的订阅方案，满足不同阶段的创作需求</p>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <UCard>
          <div class="space-y-2">
            <h3 class="font-semibold">入门</h3>
            <div class="text-3xl font-bold">¥0</div>
            <ul class="text-gray-500 text-sm list-disc list-inside">
              <li>基础素材管理</li>
              <li>本地导出</li>
              <li>社区模板</li>
            </ul>
            <NuxtLink to="/signup"><UButton block>免费开始</UButton></NuxtLink>
          </div>
        </UCard>

        <UCard>
          <div class="space-y-2">
            <h3 class="font-semibold">专业</h3>
            <div class="text-3xl font-bold">¥39<span class="text-base font-normal text-gray-500">/月</span></div>
            <ul class="text-gray-500 text-sm list-disc list-inside">
              <li>批量任务队列</li>
              <li>风格与尺寸预设</li>
              <li>优先下载通道</li>
            </ul>
            <NuxtLink to="/signup"><UButton block>购买会员</UButton></NuxtLink>
          </div>
        </UCard>

        <UCard>
          <div class="space-y-2">
            <h3 class="font-semibold">团队</h3>
            <div class="text-3xl font-bold">¥99<span class="text-base font-normal text-gray-500">/月</span></div>
            <ul class="text-gray-500 text-sm list-disc list-inside">
              <li>多席位协作</li>
              <li>权限与审计</li>
              <li>企业支持</li>
            </ul>
            <NuxtLink to="/signup"><UButton block>联系销售</UButton></NuxtLink>
          </div>
        </UCard>
      </div>
    </UContainer>
  </section>
</template>

<script setup lang="ts"></script>

