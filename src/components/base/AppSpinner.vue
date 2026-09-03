<script setup lang="ts">
/** 加载指示器。纯 CSS 旋转圆环，不引依赖。 */
withDefaults(defineProps<{ size?: number }>(), { size: 22 })
</script>

<template>
  <span
    class="spinner"
    role="status"
    aria-label="加载中"
    :style="{ width: `${size}px`, height: `${size}px` }"
  />
</template>

<style scoped>
.spinner {
  display: block;
  border: 2px solid var(--color-border-strong);
  border-top-color: var(--color-text-secondary);
  border-radius: var(--radius-full);
  animation: spin 700ms linear infinite;
}

@keyframes spin {
  to {
    rotate: 360deg;
  }
}
</style>
