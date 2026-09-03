<script setup lang="ts">
/** 桌面端左侧边栏：品牌 + 导航 + 折叠开关。 */
import AppBrand from './AppBrand.vue'
import AppNavList from './AppNavList.vue'
import AppSidebarFooter from './AppSidebarFooter.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import { NAV_GROUPS } from '@/config/navigation'
import { useLayoutStore } from '@/stores/layout'
import { storeToRefs } from 'pinia'

const layout = useLayoutStore()
const { sidebarCollapsed } = storeToRefs(layout)
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar--collapsed': sidebarCollapsed }">
    <div class="sidebar__head">
      <AppBrand class="sidebar__brand" :compact="sidebarCollapsed" />
      <button
        class="sidebar__toggle"
        type="button"
        :aria-label="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
        :aria-expanded="!sidebarCollapsed"
        @click="layout.toggleSidebar()"
      >
        <AppIcon :name="sidebarCollapsed ? 'panelRight' : 'panelLeft'" :size="20" />
      </button>
    </div>

    <div class="sidebar__body">
      <AppNavList :groups="NAV_GROUPS" :collapsed="sidebarCollapsed" />
    </div>

    <AppSidebarFooter :collapsed="sidebarCollapsed" />
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: var(--sidebar-width);
  height: 100%;
  flex-shrink: 0;
  background: var(--color-bg);
  transition: width var(--duration) var(--ease);
}

.sidebar--collapsed {
  width: var(--sidebar-width-collapsed);
}

.sidebar__head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  height: var(--header-height);
  padding: 0 var(--space-4);
  flex-shrink: 0;
}

.sidebar__toggle {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  margin-left: auto;
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  transition: background var(--duration) var(--ease), color var(--duration) var(--ease);
}

.sidebar__toggle:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

/*
 * 收起态宽度只够放一个图标：默认显示 logo，
 * 鼠标悬停或键盘聚焦时换成展开按钮，二者占同一格。
 */
.sidebar--collapsed .sidebar__head {
  display: grid;
  place-items: center;
  padding: 0;
}

.sidebar--collapsed .sidebar__brand,
.sidebar--collapsed .sidebar__toggle {
  grid-area: 1 / 1;
  margin-left: 0;
  transition: opacity var(--duration) var(--ease);
}

/*
 * 收起态：按钮撑满整个头部格子，头部任意位置（上下左右）都能触发切换，
 * 视觉上的 32×32 底块交给 ::before 画，避免热区只有图标那一小块。
 */
.sidebar--collapsed .sidebar__toggle {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 0;
}

.sidebar--collapsed .sidebar__toggle::before {
  position: absolute;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  content: '';
  inset: 50% auto auto 50%;
  translate: -50% -50%;
  transition: background var(--duration) var(--ease);
}

.sidebar--collapsed .sidebar__toggle:hover {
  background: none;
}

.sidebar--collapsed .sidebar__toggle:hover::before {
  background: var(--color-bg-hover);
}

/* 图标需盖在底块之上 */
.sidebar--collapsed .sidebar__toggle :deep(.app-icon) {
  position: relative;
}

/* 隐藏的一方不拦截点击，避免透明按钮盖住 logo */
.sidebar--collapsed .sidebar__toggle {
  opacity: 0;
  pointer-events: none;
}

/*
 * 用 :has(:focus-visible) 而非 :focus-within：
 * 鼠标点击折叠后按钮会留焦点，:focus-within 会把 logo 一直压住直到刷新。
 */
.sidebar--collapsed .sidebar__head:hover .sidebar__brand,
.sidebar--collapsed .sidebar__head:has(:focus-visible) .sidebar__brand {
  opacity: 0;
  pointer-events: none;
}

.sidebar--collapsed .sidebar__head:hover .sidebar__toggle,
.sidebar--collapsed .sidebar__head:has(:focus-visible) .sidebar__toggle {
  opacity: 1;
  pointer-events: auto;
}

.sidebar__body {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
}
</style>
