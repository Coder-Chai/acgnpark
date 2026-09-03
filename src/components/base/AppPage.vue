<script setup lang="ts">
/** 页面容器：统一内容区的最大宽度、内边距与标题排版。 */
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <div class="page">
    <header class="page__head">
      <h1>{{ title }}</h1>
      <p v-if="description">{{ description }}</p>
    </header>
    <slot />
  </div>
</template>

<style scoped>
.page {
  padding: var(--space-6) var(--content-padding-x) var(--space-10);
}

.page__head {
  margin-bottom: var(--space-6);
}

.page__head h1 {
  font-size: var(--font-2xl);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.page__head p {
  margin-top: var(--space-2);
  color: var(--color-text-secondary);
}

@media (max-width: 767px) {
  .page {
    padding: var(--space-4) var(--content-padding-x) var(--space-8);
  }

  .page__head h1 {
    font-size: var(--font-xl);
  }
}
</style>
