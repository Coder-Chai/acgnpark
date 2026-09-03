import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'acgnpark:theme'

export type ThemeMode = 'light' | 'dark'

/**
 * 主题状态。
 * 首次访问跟随系统偏好，用户手动切换后写入 localStorage 并覆盖系统设置。
 * 通过 <html data-theme> 生效，样式细节全在 tokens.css 里。
 */
export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>(resolveInitialMode())

  watch(mode, (value, previous) => applyMode(value, previous), { immediate: true })

  function toggle() {
    mode.value = mode.value === 'dark' ? 'light' : 'dark'
  }

  return { mode, toggle }
})

function resolveInitialMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // 隐私模式下不可读，退回系统偏好
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyMode(mode: ThemeMode, previous?: ThemeMode) {
  const root = document.documentElement

  // 切换瞬间关掉全局过渡：否则每个元素的颜色各自补间 220ms，看上去像闪烁。
  // 首次应用（无 previous）不需要，此时页面还没渲染。
  if (previous) {
    root.classList.add('theme-switching')
    // 强制重排，确保"关过渡"先于变量改动生效
    void root.offsetHeight
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.remove('theme-switching'))
    })
  }

  root.dataset.theme = mode
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // 写入失败不影响当次会话的主题
  }
}
