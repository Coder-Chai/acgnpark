<script setup lang="ts">
/**
 * 回到顶部。
 * 滚动容器不是 window 而是右侧内容栏，因此目标元素由外部传入，
 * 组件自身不去猜谁在滚动。
 */
import { onBeforeUnmount, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'

const props = withDefaults(
  defineProps<{
    target: HTMLElement | null
    /** 滚动超过多少像素后出现 */
    threshold?: number
  }>(),
  { threshold: 400 },
)

const visible = ref(false)
let observed: HTMLElement | null = null

function onScroll() {
  visible.value = (observed?.scrollTop ?? 0) > props.threshold
}

function detach() {
  observed?.removeEventListener('scroll', onScroll)
  observed = null
}

watch(
  () => props.target,
  (element) => {
    detach()
    observed = element
    element?.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
  },
  { immediate: true },
)

onBeforeUnmount(detach)

function toTop() {
  props.target?.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <Transition name="rise">
    <button v-if="visible" class="to-top" type="button" aria-label="回到顶部" @click="toTop">
      <AppIcon name="arrowUp" />
    </button>
  </Transition>
</template>

<style scoped>
.to-top {
  position: fixed;
  right: var(--space-6);
  bottom: var(--space-6);
  z-index: var(--z-sticky);
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  box-shadow: var(--shadow-md);
  transition: color var(--duration) var(--ease), background var(--duration) var(--ease);
}

.to-top:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

/* 移动端避开底部 TabBar 与手势条 */
@media (max-width: 767px) {
  .to-top {
    right: var(--space-4);
    bottom: calc(var(--tabbar-height) + var(--safe-bottom) + var(--space-4));
  }
}

.rise-enter-active,
.rise-leave-active {
  transition: opacity var(--duration) var(--ease), translate var(--duration) var(--ease);
}

.rise-enter-from,
.rise-leave-to {
  opacity: 0;
  translate: 0 8px;
}
</style>
