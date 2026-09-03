<script setup lang="ts">
/**
 * 移动端导航抽屉。
 * TabBar 只放主入口，二级导航（作品/收藏/历史…）由抽屉承载。
 */
import { onUnmounted, watch } from 'vue'
import AppBrand from './AppBrand.vue'
import AppNavList from './AppNavList.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import { NAV_GROUPS } from '@/config/navigation'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

// 抽屉打开时锁定背景滚动
watch(
  () => props.open,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
  },
)

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="drawer__overlay" @click="emit('close')" />
    </Transition>
    <Transition name="slide">
      <aside v-if="open" class="drawer" role="dialog" aria-modal="true" aria-label="导航菜单">
        <div class="drawer__head">
          <AppBrand />
          <button class="drawer__close" type="button" aria-label="关闭菜单" @click="emit('close')">
            <AppIcon name="close" />
          </button>
        </div>
        <div class="drawer__body">
          <AppNavList :groups="NAV_GROUPS" @navigate="emit('close')" />
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer__overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  background: var(--color-overlay);
}

.drawer {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: var(--z-drawer);
  display: flex;
  width: min(78vw, 300px);
  flex-direction: column;
  padding-top: var(--safe-top);
  background: var(--color-bg);
}

.drawer__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.drawer__close {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
}

.drawer__body {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--duration) var(--ease);
}

/* 退场中的遮罩不再拦点击，否则这段时间内的点击会被它吃掉 */
.fade-leave-active {
  pointer-events: none;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform var(--duration) var(--ease);
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
