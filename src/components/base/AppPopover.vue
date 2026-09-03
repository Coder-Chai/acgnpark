<script setup lang="ts">
/**
 * 轻量气泡浮层。
 * 只负责开合与关闭时机（点击外部、Esc、路由跳转），内容与触发器由调用方通过插槽给出。
 */
import { onScopeDispose, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

withDefaults(
  defineProps<{
    /** 面板贴在触发器的哪一侧 */
    placement?: 'top' | 'bottom'
    /** 面板与触发器的对齐边。触发器贴着屏幕右缘时用 end，否则面板会伸出视口 */
    align?: 'start' | 'center' | 'end'
  }>(),
  { placement: 'top', align: 'start' },
)

const route = useRoute()
const root = ref<HTMLElement | null>(null)
const open = ref(false)

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

/* 只在展开时挂监听：浮层大多数时候是关着的，没必要常驻两个全局事件 */
watch(open, (value) => {
  const method = value ? 'addEventListener' : 'removeEventListener'
  document[method]('pointerdown', onDocumentPointerDown as EventListener)
  document[method]('keydown', onKeydown as EventListener)
})

// 跳转后浮层应当消失
watch(() => route.fullPath, close)

onScopeDispose(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown as EventListener)
  document.removeEventListener('keydown', onKeydown as EventListener)
})

defineExpose({ close })
</script>

<template>
  <div ref="root" class="popover">
    <slot name="trigger" :open="open" :toggle="toggle" />
    <Transition :name="`pop-${placement}`">
      <div
        v-if="open"
        class="popover__panel"
        :class="[`popover__panel--${align}`, `popover__panel--${placement}`]"
        role="dialog"
      >
        <slot :close="close" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.popover {
  position: relative;
}

.popover__panel {
  position: absolute;
  z-index: var(--z-drawer);
  min-width: 160px;
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  box-shadow: var(--shadow-md);
}

.popover__panel--top {
  bottom: calc(100% + var(--space-2));
}

.popover__panel--bottom {
  top: calc(100% + var(--space-2));
}

.popover__panel--start {
  left: 0;
}

.popover__panel--center {
  left: 50%;
  transform: translateX(-50%);
}

.popover__panel--end {
  right: 0;
}

/* 从触发器那一侧展开，方向跟着 placement 走 */
.pop-top-enter-active,
.pop-top-leave-active,
.pop-bottom-enter-active,
.pop-bottom-leave-active {
  transition: opacity var(--duration) var(--ease), translate var(--duration) var(--ease);
}

.pop-top-enter-from,
.pop-top-leave-to {
  opacity: 0;
  translate: 0 4px;
}

.pop-bottom-enter-from,
.pop-bottom-leave-to {
  opacity: 0;
  translate: 0 -4px;
}

@media (prefers-reduced-motion: reduce) {
  .pop-top-enter-active,
  .pop-top-leave-active,
  .pop-bottom-enter-active,
  .pop-bottom-leave-active {
    transition: none;
  }
}
</style>
