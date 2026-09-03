import { computed } from 'vue'
import { useMediaQuery } from './useMediaQuery'

/** 移动端断点。与 tokens 中的布局尺寸配套，改这里即可全局生效。 */
export const MOBILE_BREAKPOINT = 768

export type LayoutMode = 'desktop' | 'mobile'

/**
 * 当前布局模式。
 * 布局组件据此二选一渲染，业务组件不应直接判断屏幕宽度。
 */
export function useLayoutMode() {
  const isMobile = useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  const mode = computed<LayoutMode>(() => (isMobile.value ? 'mobile' : 'desktop'))

  return { isMobile, isDesktop: computed(() => !isMobile.value), mode }
}
