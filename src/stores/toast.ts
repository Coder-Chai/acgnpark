import { ref } from 'vue'
import { defineStore } from 'pinia'

export type ToastType = 'success' | 'error'

export interface Toast {
  id: number
  message: string
  type: ToastType
}

/** 单条提示的停留时长 */
const TOAST_DURATION = 2000
/** 同屏最多堆几条。再多就不是提示而是刷屏了，超出时挤掉最早的一条 */
const TOAST_MAX = 3

/**
 * 轻提示。放在 store 而不是各页面自己渲染一个：
 * 提示要浮在所有内容（包括弹窗）之上，挂在页面里会被弹窗盖住；
 * 而且同一时间全站只该有一处提示，不然两个页面各弹各的会打架。
 *
 * 只用于「做了但看不见结果」的动作 —— 复制、保存、删除。
 * 有可见结果的动作（展开菜单、切换分区）不提示，那是噪音。
 */
export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])
  const timers = new Map<number, ReturnType<typeof setTimeout>>()
  let seed = 0

  function dismiss(id: number) {
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
    toasts.value = toasts.value.filter((item) => item.id !== id)
  }

  function show(message: string, type: ToastType = 'success') {
    const id = (seed += 1)
    toasts.value = [...toasts.value, { id, message, type }]
    // 溢出的最早一条直接收掉，连它的计时器一起清
    while (toasts.value.length > TOAST_MAX) {
      const oldest = toasts.value[0]
      if (!oldest) break
      dismiss(oldest.id)
    }
    timers.set(
      id,
      setTimeout(() => dismiss(id), TOAST_DURATION),
    )
  }

  return { toasts, show, dismiss }
})
