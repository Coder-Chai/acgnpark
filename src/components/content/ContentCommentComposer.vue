<script setup lang="ts">
/**
 * 评论输入框。聚焦即展开成撰写态：输入框长高、下面接一排工具（表情、字数、发布）。
 *
 * 从详情弹窗里拆出来单独放：自适应高度、表情面板、撰写态的进退这几段逻辑
 * 与「看内容」无关，混在一千多行的弹窗里，改一次输入框要在整份文件里来回找。
 * 帖子详情页、评论回复以后都能直接用这一个。
 */
import { computed, onScopeDispose, ref, watch } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'
import { useAuthGuard } from '@/composables/useAuthGuard'

/** 单条评论上限。与后端校验保持一致，超出直接截断在输入层，不等提交才报错 */
const COMMENT_MAX = 500
/** 输入框最多长到这个高度（约五行），再多就内部滚动，免得把上面的内容挤没了 */
const DRAFT_MAX_HEIGHT = 108
/** 收起态就一行 */
const DRAFT_LINE_HEIGHT = 20
/** 撰写态的起始高度（约三行），一开始就摊开写字的空间 */
const DRAFT_COMPOSING_HEIGHT = 62

withDefaults(defineProps<{ placeholder?: string }>(), { placeholder: '友好评论' })

/** 发布一条评论。文本已 trim 过校验，登录门禁也已通过 */
const emit = defineEmits<{ send: [text: string] }>()

/*
 * 撰写态。对外用 v-model:composing 暴露，外部据此让路
 * （详情弹窗靠它收起旁边那排互动图标）。
 * 失焦不立刻收：草稿还在就保持展开，
 * 否则点一下别处，刚写的半句话就被折叠藏起来了。
 */
const composing = defineModel<boolean>('composing', { default: false })

const { requireLogin } = useAuthGuard()

const draft = ref('')
const draftEl = ref<HTMLTextAreaElement | null>(null)
/** 输入区容器。判断点击是否落在框外，用来收起表情面板 */
const rootEl = ref<HTMLElement | null>(null)

const emojiOpen = ref(false)

const canSend = computed(() => draft.value.trim().length > 0)

function onFocus() {
  composing.value = true
  // 展开后重新量一次高度，让输入框立刻长到撰写态的起始高度
  requestAnimationFrame(autoGrow)
}

function collapse() {
  if (canSend.value || emojiOpen.value) return
  composing.value = false
  // 收起后焦点也要交出去，否则下次点输入框不会再触发 focus，撰写态展不开
  draftEl.value?.blur()
  requestAnimationFrame(autoGrow)
}

/*
 * 表情面板开着时，点框外任意位置都收起它。
 * 用 mousedown 而不是 click：面板里的按钮都做了 mousedown.prevent 保住焦点，
 * 走 click 的话时序上更晚，容易和插入表情打架。
 */
function onDocMouseDown(event: MouseEvent) {
  const target = event.target
  if (target instanceof Node && rootEl.value?.contains(target)) return
  emojiOpen.value = false
  // 面板是撑着撰写态的最后一个理由，它一收，空草稿也该跟着收起
  collapse()
}

watch(emojiOpen, (value) => {
  if (value) document.addEventListener('mousedown', onDocMouseDown)
  else document.removeEventListener('mousedown', onDocMouseDown)
})

onScopeDispose(() => document.removeEventListener('mousedown', onDocMouseDown))

/** 常用表情。等接了后端表情包再换成接口数据，这里先给一组够用的 */
const EMOJIS = [
  '😀', '😂', '🥰', '😭', '😱', '🤔', '😴', '🙈',
  '👍', '👏', '🙏', '💪', '🎉', '🔥', '💯', '✨',
  '❤️', '💔', '⭐', '🌸', '🍀', '🌈', '☕', '🎵',
]

/**
 * 在光标处插入表情，而不是简单追加到末尾 —— 用户回头补一个表情时
 * 光标常常停在句子中间，追加到末尾等于插错位置。
 */
function insertEmoji(emoji: string) {
  const el = draftEl.value
  if (!el) {
    draft.value = `${draft.value}${emoji}`.slice(0, COMMENT_MAX)
    return
  }
  const start = el.selectionStart
  const end = el.selectionEnd
  draft.value = `${draft.value.slice(0, start)}${emoji}${draft.value.slice(end)}`.slice(
    0,
    COMMENT_MAX,
  )
  // DOM 更新后再摆光标，否则会被 v-model 的重新赋值推到末尾
  requestAnimationFrame(() => {
    const caret = start + emoji.length
    el.focus()
    el.setSelectionRange(caret, caret)
    autoGrow()
  })
}

/*
 * 跟着内容长高。textarea 不会自己收缩，所以每次先把 height 抹回 auto 量一次 scrollHeight，
 * 再取和上限的较小值 —— 只加不减的话删字后会留一段空白。
 */
function autoGrow() {
  const el = draftEl.value
  if (!el) return

  /*
   * 量高度必须先把 height 抹回 auto（textarea 不会自己收缩），但读 scrollHeight 会触发一次
   * 布局刷新 —— 此时的计算高度就是 auto，height 过渡会从「内容裸高」而不是原高度起步，
   * 于是看起来是先跳一下再滑过去。所以量的时候临时关掉过渡，量完先还原成原高度、
   * 刷一次布局把它定成过渡起点，再开过渡赋新值。
   */
  const from = el.style.height
  el.style.transition = 'none'
  el.style.height = 'auto'
  // 撰写态先给三行的底，写长了再往上顶到上限
  const min = composing.value ? DRAFT_COMPOSING_HEIGHT : DRAFT_LINE_HEIGHT
  const to = Math.max(min, Math.min(el.scrollHeight, DRAFT_MAX_HEIGHT))
  el.style.height = from
  void el.offsetHeight
  el.style.transition = ''
  el.style.height = `${to}px`
}

function send() {
  if (!canSend.value) return
  // 拦在发布这一步而不是聚焦时：还没写完就被弹登录框很打断
  if (!requireLogin('评论')) return
  emit('send', draft.value.trim())
  reset()
}

/** 清空并收起。外部换了一条内容时也调它，免得草稿串到下一篇 */
function reset() {
  draft.value = ''
  emojiOpen.value = false
  composing.value = false
  /*
   * 发布按钮按了 mousedown.prevent，焦点一直没离开 textarea；
   * 这里不主动 blur 的话，下次再点输入框不会触发 focus 事件，撰写态就展不开了。
   */
  draftEl.value?.blur()
  // 清空后高度要跟着收回一行，否则输入框会一直保持刚才的高度
  requestAnimationFrame(autoGrow)
}

/**
 * Esc 的分层退出：先收表情面板，再退撰写态。
 * 返回 true 表示这一下被输入框用掉了，外层不该继续关弹窗 ——
 * 免得一不小心把草稿连窗一起弄没了。
 */
function escape(): boolean {
  if (emojiOpen.value) {
    emojiOpen.value = false
    return true
  }
  if (composing.value) {
    composing.value = false
    draftEl.value?.blur()
    requestAnimationFrame(autoGrow)
    return true
  }
  return false
}

defineExpose({ escape, reset })
</script>

<template>
  <div ref="rootEl" class="composer" :class="{ 'composer--composing': composing }">
    <!--
      用 textarea 而不是 input：长评论要能换行往下堆，
      input 是单行的，字一多就只能在一条线里横着滚，看不到自己写过什么。
      回车直接发送，Shift+Enter 换行 —— 与主流输入框一致。
    -->
    <textarea
      ref="draftEl"
      v-model="draft"
      class="composer__field"
      rows="1"
      :maxlength="COMMENT_MAX"
      :placeholder="placeholder"
      aria-label="评论"
      @focus="onFocus"
      @blur="collapse"
      @input="autoGrow"
      @keydown.enter.exact.prevent="send"
    />

    <!--
      撰写态才出现的工具行：表情在左，字数与发布在右。
      按钮一律 mousedown.prevent —— 否则点它们会先让 textarea 失焦，
      输入框当场收起，等于点不到。
    -->
    <div v-if="composing" class="tools">
      <button
        class="tools__emoji"
        :class="{ 'tools__emoji--on': emojiOpen }"
        type="button"
        aria-label="表情"
        :aria-expanded="emojiOpen"
        @mousedown.prevent
        @click="emojiOpen = !emojiOpen"
      >
        <AppIcon name="smile" :size="20" />
      </button>

      <!-- 快到上限才提示字数，平时不占视线 -->
      <span v-if="draft.length > COMMENT_MAX * 0.8" class="tools__count">
        {{ draft.length }}/{{ COMMENT_MAX }}
      </span>

      <button
        class="tools__send"
        type="button"
        :disabled="!canSend"
        @mousedown.prevent
        @click="send"
      >
        发布
      </button>
    </div>

    <!-- 表情面板浮在输入框上方，不挤压正文与评论的位置 -->
    <div v-if="emojiOpen" class="emoji">
      <button
        v-for="emoji in EMOJIS"
        :key="emoji"
        class="emoji__item"
        type="button"
        :aria-label="emoji"
        @mousedown.prevent
        @click="insertEmoji(emoji)"
      >
        {{ emoji }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/*
 * 输入框会随内容长高，所以不定死 height，用 padding + 内部行高撑出最小一行；
 * 圆角也从 full 降到 md —— 全圆角的胶囊长到三四行会变成一个奇怪的长条。
 */
.composer {
  position: relative;
  display: flex;
  gap: var(--space-2);
  /* 收起态是「一行 + 无工具」，撰写态改成上下堆叠（输入区在上、工具行在下） */
  flex-direction: column;
  min-width: 0;
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-bg-sunken);
  color: var(--color-text-tertiary);
  transition: box-shadow var(--duration) var(--ease);
}

/* 撰写态描一圈品牌色，明确「现在在这里写字」 */
.composer--composing {
  box-shadow: inset 0 0 0 1px var(--color-accent);
}

.composer__field {
  width: 100%;
  height: 20px;
  max-height: 108px;
  border: none;
  background: none;
  color: var(--color-text);
  font: inherit;
  font-size: var(--font-sm);
  line-height: 1.5;
  outline: none;
  /* 高度是 JS 按内容算的（见 autoGrow），这里补一段过渡让它滑上去而不是跳一下 */
  transition: height 200ms var(--ease);
  /* 手动拉伸会破掉自适应高度；纵向滚动只在到达上限后出现 */
  resize: none;
  overflow-y: auto;
  scrollbar-width: none;
}

.composer__field::-webkit-scrollbar {
  display: none;
}

.composer__field::placeholder {
  color: var(--color-text-tertiary);
}

/* ── 撰写态的工具行 ── */
.tools {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  /* 跟着输入框长高的节奏淡入，时长与 .composer__field 的 height 过渡一致 */
  animation: tools-in 200ms var(--ease);
}

@keyframes tools-in {
  from {
    opacity: 0;
    translate: 0 var(--space-2);
  }
}

@keyframes emoji-in {
  from {
    opacity: 0;
    scale: 0.98;
    translate: 0 var(--space-1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .composer__field {
    transition: none;
  }

  .tools,
  .emoji {
    animation: none;
  }
}

.tools__emoji {
  display: grid;
  width: 28px;
  height: 28px;
  margin-left: calc(var(--space-1) * -1);
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  cursor: pointer;
  place-items: center;
  transition: color var(--duration) var(--ease), background var(--duration) var(--ease);
}

.tools__emoji:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
}

.tools__emoji--on,
.tools__emoji--on:hover {
  color: var(--color-accent);
}

.tools__count {
  margin-left: auto;
  color: var(--color-text-tertiary);
  font-size: var(--font-xs);
  font-variant-numeric: tabular-nums;
}

/*
 * 发布按钮。空草稿时不隐藏而是置灰失效 —— 按钮忽隐忽现会让工具行的宽度跳来跳去，
 * 而且看不到按钮就不知道写完该点哪儿。
 */
.tools__send {
  height: var(--control-height);
  min-width: 64px;
  /* count 不存在时靠这条推到右端 */
  margin-left: auto;
  padding: 0 var(--space-4);
  border-radius: var(--radius-full);
  background: var(--color-accent);
  color: var(--color-text-inverse);
  font-size: var(--font-sm);
  font-weight: 600;
  cursor: pointer;
  transition: background var(--duration) var(--ease), opacity var(--duration) var(--ease);
}

/* 字数提示占了 auto 之后，按钮自己就不需要再推一次 */
.tools__count + .tools__send {
  margin-left: 0;
}

.tools__send:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.tools__send:disabled {
  background: var(--color-border-strong);
  color: var(--color-text-tertiary);
  cursor: not-allowed;
}

/* ── 表情面板 ── */
.emoji {
  position: absolute;
  z-index: 1;
  bottom: calc(100% + var(--space-2));
  left: 0;
  display: grid;
  width: 100%;
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  box-shadow: var(--shadow-md);
  grid-template-columns: repeat(8, 1fr);
  animation: emoji-in 160ms var(--ease);
}

.emoji__item {
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  font-size: var(--font-lg);
  line-height: 1;
  cursor: pointer;
  transition: background var(--duration) var(--ease);
}

.emoji__item:hover {
  background: var(--color-bg-hover);
}
</style>
