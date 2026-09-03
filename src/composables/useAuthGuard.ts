import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

/**
 * 需要登录的动作统一走这里。
 *
 * 之前点赞、收藏、评论未登录也能点：本地数字加一，刷新就没了，
 * 而个人页却写着「登录即可发帖、评论、收藏喜欢的内容」，两处对不上。
 * 门禁收在一个地方，将来加「发帖」「关注」时不必各写一遍拦截逻辑。
 */
export function useAuthGuard() {
  const auth = useAuthStore()
  const toast = useToastStore()

  /**
   * 已登录返回 true；未登录则唤起登录弹窗并返回 false。
   * 调用方写成 `if (!requireLogin('点赞')) return` 即可。
   *
   * @param action 动作名，用于提示语（「登录后即可点赞」）
   */
  function requireLogin(action: string): boolean {
    if (auth.isLoggedIn) return true
    toast.show(`登录后即可${action}`)
    auth.openLoginDialog()
    return false
  }

  return { requireLogin }
}
