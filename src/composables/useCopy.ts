import { onScopeDispose, ref } from 'vue'
import { useToastStore } from '@/stores/toast'

/** 图标切成对勾后停留多久变回来 */
const FEEDBACK_DURATION = 1600

/**
 * 复制到剪贴板。两处反馈：按钮就地把图标换成对勾（说明「是这一处成了」），
 * 外加一条全站轻提示（说明「确实成了」）。只给其中一个都不够 ——
 * 只有图标的话反馈太轻容易漏看，只有提示的话不知道复制到的是哪一处。
 *
 * 每次调用给一份独立状态：同页可能有多处可复制（次元号、邀请码……），
 * 共用一个 copied 会让点 A 的时候 B 也跟着变成「已复制」。
 */
/**
 * 写剪贴板，成功返回 true。
 *
 * navigator.clipboard 只在安全上下文（https / localhost）里存在，而且在
 * 内嵌浏览器、局域网 IP 调试（http://192.168.x.x）下会直接抛。
 * 这类环境正是自测时最常用的，所以留一条 execCommand 的老路兜底 ——
 * 它已废弃，但至今所有浏览器都还认。
 */
async function write(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // 落到下面的兜底
  }

  try {
    const el = document.createElement('textarea')
    el.value = text
    // 挪出视口而不是 display:none —— 隐藏元素选不中，也就复制不了
    el.style.cssText = 'position:fixed;top:-9999px;opacity:0'
    // 只读，避免移动端 Safari 弹出软键盘
    el.readOnly = true
    document.body.appendChild(el)
    el.select()
    el.setSelectionRange(0, text.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  } catch {
    return false
  }
}

export function useCopy() {
  const toast = useToastStore()
  const copied = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  async function copy(text: string, message = '已复制') {
    if (!text) return

    if (await write(text)) {
      copied.value = true
      // 连点时把上一次的计时器丢掉，否则对勾会提前收
      clearTimeout(timer)
      timer = setTimeout(() => (copied.value = false), FEEDBACK_DURATION)
      toast.show(message)
      return
    }

    // 两条路都不通才报错。不能静默 —— 用户以为抄走了，粘贴出来却是别的东西。
    toast.show('复制失败，请手动选中复制', 'error')
  }

  onScopeDispose(() => clearTimeout(timer))

  return { copied, copy }
}
