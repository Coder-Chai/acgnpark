<script setup lang="ts">
/**
 * 全站轻提示出口。挂在 App 根上，只此一份；
 * 内容由 stores/toast 提供，任何组件调 toast.show() 即可。
 */
import { storeToRefs } from 'pinia'
import AppIcon from '@/components/base/AppIcon.vue'
import { useToastStore } from '@/stores/toast'

const { toasts } = storeToRefs(useToastStore())
</script>

<template>
  <Teleport to="body">
    <!-- aria-live：提示是纯视觉的，读屏用户靠这里才知道刚才那下成没成 -->
    <TransitionGroup tag="div" class="toasts" name="toast" aria-live="polite">
      <div v-for="toast in toasts" :key="toast.id" class="toast" :class="`toast--${toast.type}`">
        <AppIcon class="toast__icon" :name="toast.type === 'error' ? 'alert' : 'check'" :size="15" />
        {{ toast.message }}
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<style scoped>
/*
 * 顶部居中而不是底部：底部在移动端会被 TabBar 压住，
 * 在桌面端又离刚点的按钮太远，看不见。
 * 容器不吃指针事件，提示浮着的时候底下照样能点。
 */
.toasts {
  position: fixed;
  z-index: var(--z-toast);
  top: calc(var(--safe-top) + var(--space-8));
  left: 50%;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: center;
  pointer-events: none;
  transform: translateX(-50%);
}

.toast {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  max-width: 80vw;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-bg-elevated);
  box-shadow: var(--shadow-md);
  color: var(--color-text);
  font-size: var(--font-sm);
}

.toast__icon {
  flex-shrink: 0;
  color: var(--color-accent);
}

.toast--error .toast__icon {
  color: var(--color-danger);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity var(--duration) var(--ease), transform var(--duration) var(--ease);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 上面一条收走时，剩下的滑上去补位，不要瞬移 */
.toast-move {
  transition: transform var(--duration) var(--ease);
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active,
  .toast-move {
    transition: none;
  }
}
</style>
