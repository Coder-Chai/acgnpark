import { onScopeDispose, watch, type Ref } from 'vue'
import { useScrollLock } from '@/composables/useScrollLock'

interface OverlayOptions {
  /** 关闭弹层。遮罩点击与 Esc 都走它 */
  close: () => void
  /**
   * Esc 的优先处理。返回 true 表示「这一下我用掉了」，弹层不关闭 ——
   * 详情弹窗就靠它做到：写评论时按 Esc 先退撰写态，再按一次才关窗。
   */
  onEscape?: () => boolean
  /** 弹层打开期间的其他按键（详情弹窗的左右翻页） */
  onKeydown?: (event: KeyboardEvent) => void
}

/**
 * 弹层的公共行为：滚动锁、Esc 关闭、点遮罩关闭。
 *
 * 三个弹窗（登录、内容详情、AppModal）此前各写了一份一模一样的实现，
 * 其中「遮罩要按下和松开都在遮罩上才算」这条尤其容易漏 ——
 * 漏了的表现是：在输入框里按住鼠标拖出去松开，弹窗就没了。
 */
export function useOverlay(open: Ref<boolean>, options: OverlayOptions) {
  useScrollLock(open)

  /*
   * 点遮罩关闭要求「按下」和「松开」都在遮罩上。
   * 只判断 click 的话，在输入框里按住鼠标拖到弹窗外松开，click 会落在共同祖先
   * （也就是遮罩）身上，于是弹窗被误关 —— 选中文字时很容易触发。
   */
  let pressedOnOverlay = false

  function onOverlayPointerDown(event: PointerEvent) {
    pressedOnOverlay = event.target === event.currentTarget
  }

  function onOverlayClick(event: MouseEvent) {
    if (pressedOnOverlay && event.target === event.currentTarget) options.close()
  }

  // 挂在 document 上，不依赖弹层是否拿到焦点
  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (options.onEscape?.()) return
      options.close()
      return
    }
    options.onKeydown?.(event)
  }

  watch(open, (value) => {
    if (value) document.addEventListener('keydown', onKeydown)
    else document.removeEventListener('keydown', onKeydown)
  })

  onScopeDispose(() => document.removeEventListener('keydown', onKeydown))

  return { onOverlayPointerDown, onOverlayClick }
}
