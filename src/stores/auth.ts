import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useToastStore } from '@/stores/toast'

export interface AuthUser {
  id: string
  name: string
  /**
   * 次元号：对外展示的账号标识，可复制、可搜索。
   * 与内部 id 分开 —— id 是主键，不该出现在界面上。
   */
  uid: string
  /** 头像地址，为空时降级为网名首字 */
  avatar?: string
}

/**
 * 登录态。全站唯一来源，组件只读 isLoggedIn / user，不各自缓存。
 * 目前 login 是本地假登录，接入真实鉴权后只需替换这两个 action 的内部实现，
 * 消费方（顶栏、抽屉等）不用改。
 */
export const useAuthStore = defineStore('auth', () => {
  const toast = useToastStore()
  const user = ref<AuthUser | null>(null)
  const isLoggedIn = computed(() => user.value !== null)

  /**
   * 登录弹窗开合。放在 store 里而不是顶栏组件内，
   * 这样任何位置（收藏、发布等需要鉴权的动作）都能唤起同一个弹窗。
   */
  const loginDialogOpen = ref(false)

  function openLoginDialog() {
    loginDialogOpen.value = true
  }

  function closeLoginDialog() {
    loginDialogOpen.value = false
  }

  /** TODO: 接入真实鉴权接口，成功后用返回的用户信息覆盖 */
  function login() {
    user.value = { id: 'u1', name: '次元旅人', uid: '88203164' }
    loginDialogOpen.value = false
    // 提示写在 store 而不是登录弹窗里：登录入口不止一处（顶栏、点赞、发帖……），
    // 哪个入口进来的都该有同一句回执
    toast.show(`欢迎回来，${user.value.name}`)
  }

  function logout() {
    user.value = null
    toast.show('已退出登录')
  }

  /**
   * 改网名。网名同时出现在顶栏、抽屉、个人页，所以改在 store 里改一处，
   * 各处跟着更新；页面自己存一份的话，个人页改完顶栏还是旧名字。
   * TODO: 接入接口后在此提交，失败回滚。
   */
  function rename(name: string) {
    const next = name.trim()
    if (!user.value || !next) return
    user.value.name = next
  }

  return {
    user,
    isLoggedIn,
    loginDialogOpen,
    openLoginDialog,
    closeLoginDialog,
    login,
    logout,
    rename,
  }
})
