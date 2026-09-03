import { ref } from 'vue'
import { useAuthGuard } from '@/composables/useAuthGuard'
import type { ContentItem } from '@/types/content'

/**
 * 点赞状态。目前是本地乐观更新，
 * 接接口后只需在此发请求并在失败时回滚，页面组件不用改。
 *
 * 登录门禁也放在这里：点赞入口有卡片和详情弹窗两处，
 * 拦在各自的点击处理里迟早会漏一处。
 */
export function useLikes() {
  const { requireLogin } = useAuthGuard()
  const likedIds = ref(new Set<string>())

  function toggle(item: ContentItem) {
    if (!requireLogin('点赞')) return
    const next = new Set(likedIds.value)
    if (next.delete(item.id)) item.likes -= 1
    else {
      next.add(item.id)
      item.likes += 1
    }
    likedIds.value = next
  }

  return { likedIds, toggle }
}
