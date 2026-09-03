<script setup lang="ts">
/**
 * 占位页。尚未实现的路由统一复用此组件，标题取自路由 meta.title。
 * 实现某个页面时，把路由的 component 换成真实页面即可，无需改动此文件。
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppPage from '@/components/base/AppPage.vue'

const route = useRoute()
const title = computed(() => (route.meta.title as string | undefined) ?? '页面')
</script>

<template>
  <AppPage :title="title" description="该模块正在建设中">
    <div class="placeholder">敬请期待</div>
  </AppPage>
</template>

<style scoped>
.placeholder {
  display: grid;
  place-items: center;
  min-height: 240px;
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
  color: var(--color-text-tertiary);
}
</style>
