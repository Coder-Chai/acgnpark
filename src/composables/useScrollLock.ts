import { onScopeDispose, watch, type Ref } from 'vue'
import { useLayoutStore } from '@/stores/layout'

/**
 * 弹层打开期间锁住页面滚动。
 * 只写 store 里的计数，具体锁哪个容器由布局层决定，
 * 弹层组件不需要知道滚动容器是谁。
 */
export function useScrollLock(active: Ref<boolean>) {
  const layout = useLayoutStore()
  let locked = false

  function apply(next: boolean) {
    if (next === locked) return
    locked = next
    if (next) layout.lockScroll()
    else layout.unlockScroll()
  }

  watch(active, apply, { immediate: true })
  // 组件在打开状态下被卸载时也要还原
  onScopeDispose(() => apply(false))
}
