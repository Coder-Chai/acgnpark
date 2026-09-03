<script setup lang="ts">
/**
 * 默认布局壳。
 * 唯一职责：根据布局模式组装 Sidebar / Header / TabBar / Drawer，
 * 内容区由 <slot> 承接，业务页面对布局无感知。
 *
 * 桌面端：左侧边栏 + 右内容区（横向）
 * 移动端：顶部 Header + 内容区 + 底部 TabBar（纵向）
 */
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import AppLoginDialog from '@/components/auth/AppLoginDialog.vue'
import AppBackToTop from '@/components/base/AppBackToTop.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppTabBar from '@/components/layout/AppTabBar.vue'
import AppDrawer from '@/components/layout/AppDrawer.vue'
import { useLayoutMode } from '@/composables/useLayoutMode'
import { useLayoutStore } from '@/stores/layout'

const mainEl = ref<HTMLElement | null>(null)
const { isMobile } = useLayoutMode()
const layout = useLayoutStore()
const { drawerOpen, scrollLocked } = storeToRefs(layout)

// 切回桌面端时收起抽屉，避免残留遮罩
watch(isMobile, (mobile) => {
  if (!mobile) layout.closeDrawer()
})
</script>

<template>
  <div class="layout" :class="isMobile ? 'layout--mobile' : 'layout--desktop'">
    <AppSidebar v-if="!isMobile" />

    <div ref="mainEl" class="layout__main" :class="{ 'layout__main--locked': scrollLocked > 0 }">
      <AppHeader :show-menu="isMobile" :show-brand="isMobile" @menu-click="layout.openDrawer()" />

      <main class="layout__content">
        <slot />
      </main>

      <AppTabBar v-if="isMobile" />
    </div>

    <AppBackToTop :target="mainEl" />

    <AppDrawer v-if="isMobile" :open="drawerOpen" @close="layout.closeDrawer()" />

    <!-- 全局只挂一份，开合由 auth store 控制 -->
    <AppLoginDialog />
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  height: 100%;
  /* 移动端浏览器动态地址栏：优先用小视口高度避免底栏被遮挡 */
  height: 100dvh;
}

/*
 * 滚动容器是整个右侧栏（含 Header），不是内容区 ——
 * 这样滚动条贴着视口右缘从顶部起算，Header 用 sticky 悬停其上。
 */
.layout__main {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  overflow-y: auto;
  /*
   * 始终为滚动条预留槽位。弹层打开时会把 overflow 切成 hidden，
   * 没有这一行，滚动条消失的瞬间内容区会突然变宽，整页横向跳一下。
   */
  scrollbar-gutter: stable;
  overscroll-behavior-y: contain;
  background: var(--color-bg);
  -webkit-overflow-scrolling: touch;
}

/* 弹层打开时锁住内容区滚动；滚动位置保留，关闭后原地继续 */
.layout__main--locked {
  overflow-y: hidden;
}

.layout__content {
  flex: 1;
}

.layout--mobile .layout__main {
  padding-top: var(--safe-top);
}
</style>
