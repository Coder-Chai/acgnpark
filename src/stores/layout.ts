import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

const COLLAPSE_KEY = 'acgnpark:sidebar-collapsed'

/**
 * 布局交互状态。
 * 只存"用户意图"（是否收起侧边栏、是否打开抽屉），不存屏幕尺寸——
 * 尺寸是环境，由 useLayoutMode 派生。
 */
export const useLayoutStore = defineStore('layout', () => {
  const sidebarCollapsed = ref(readCollapsed())
  const drawerOpen = ref(false)
  /**
   * 弹层打开期间锁定内容区滚动。
   * 真正的滚动容器是 .layout__main 而不是 body，所以由布局组件消费这个标记，
   * 弹层本身不去操作 DOM。计数而非布尔，多个弹层叠加时不会互相解锁。
   */
  const scrollLocked = ref(0)

  watch(sidebarCollapsed, (value) => {
    try {
      localStorage.setItem(COLLAPSE_KEY, String(value))
    } catch {
      // 隐私模式下 localStorage 不可写，忽略即可
    }
  })

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function openDrawer() {
    drawerOpen.value = true
  }

  function closeDrawer() {
    drawerOpen.value = false
  }

  function lockScroll() {
    scrollLocked.value += 1
  }

  function unlockScroll() {
    scrollLocked.value = Math.max(0, scrollLocked.value - 1)
  }

  return {
    sidebarCollapsed,
    drawerOpen,
    scrollLocked,
    toggleSidebar,
    openDrawer,
    closeDrawer,
    lockScroll,
    unlockScroll,
  }
})

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === 'true'
  } catch {
    return false
  }
}
