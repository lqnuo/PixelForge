<template>
  <div>
    <SiteNavbar />
    <main>
      <UContainer class="py-10">
        <slot />
      </UContainer>
    </main>
    <SiteFooter />
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
main {
  min-height: calc(100svh - 128px);
}
</style>

