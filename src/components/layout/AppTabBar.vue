<script setup lang="ts">
/** 移动端底部标签栏。固定在视口底部，自动避让 iOS 手势条。 */
import AppIcon from '@/components/base/AppIcon.vue'
import { TABBAR_ITEMS } from '@/config/navigation'
</script>

<template>
  <nav class="tabbar" aria-label="主导航">
    <template v-for="item in TABBAR_ITEMS" :key="String(item.name)">
      <!-- 站外入口（如创作台）新窗口打开；底栏空间紧，不画箭头 -->
      <a v-if="item.href" class="tabbar__item" :href="item.href" target="_blank" rel="noopener">
        <AppIcon :name="item.icon" :size="22" />
        <span>{{ item.label }}</span>
      </a>

      <RouterLink
        v-else
        class="tabbar__item"
        active-class="tabbar__item--active"
        :to="{ name: item.name }"
      >
        <AppIcon :name="item.icon" :size="22" />
        <span>{{ item.label }}</span>
      </RouterLink>
    </template>
  </nav>
</template>

<style scoped>
.tabbar {
  /* 与 Header 同理：吸在滚动容器底部，不随内容滚走 */
  position: sticky;
  bottom: 0;
  z-index: var(--z-sticky);
  display: flex;
  height: calc(var(--tabbar-height) + var(--safe-bottom));
  padding-bottom: var(--safe-bottom);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
  flex-shrink: 0;
}

.tabbar__item {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--color-text-tertiary);
  font-size: var(--font-xs);
  transition: color var(--duration) var(--ease);
  /* 移动端点击不显示灰色高亮块 */
  -webkit-tap-highlight-color: transparent;
}

/* 选中态用正文色加粗，不上品牌紫 */
.tabbar__item--active {
  color: var(--color-text);
  font-weight: 600;
}
</style>
