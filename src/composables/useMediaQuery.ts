import { onScopeDispose, readonly, ref, type Ref } from 'vue'

/**
 * 响应式的 matchMedia 封装。
 * 用媒体查询而非监听 resize，避免高频回调；组件卸载时自动解绑。
 */
export function useMediaQuery(query: string): Readonly<Ref<boolean>> {
  const matches = ref(false)

  if (typeof window !== 'undefined' && 'matchMedia' in window) {
    const mql = window.matchMedia(query)
    matches.value = mql.matches

    const onChange = (event: MediaQueryListEvent) => {
      matches.value = event.matches
    }
    mql.addEventListener('change', onChange)
    onScopeDispose(() => mql.removeEventListener('change', onChange))
  }

  return readonly(matches)
}
