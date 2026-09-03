<script setup lang="ts">
/**
 * 内容详情弹窗。左图右文：左侧图集（多图可翻页），右侧作者信息、正文、标签、时间与评论。
 * 只负责展示与局部交互（翻页、关注、点赞），数据由外部传入，
 * 关闭动作以事件抛出 —— 列表页决定弹窗从哪个卡片打开。
 */
import { computed, onScopeDispose, ref, watch } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'
import ContentCommentComposer from '@/components/content/ContentCommentComposer.vue'
import { useAuthGuard } from '@/composables/useAuthGuard'
import { useLayoutMode } from '@/composables/useLayoutMode'
import { useOverlay } from '@/composables/useOverlay'
import { formatCount } from '@/utils/format'
import {
  MINIPROGRAM_COMMENTS_CTA,
  MINIPROGRAM_CTA,
  MINIPROGRAM_FALLBACK_HINT,
  MINIPROGRAM_URL,
} from '@/config/site'
import type { ContentDetail } from '@/types/content'

const props = defineProps<{
  detail: ContentDetail | null
  /** 触发卡片在视口中的位置，弹窗由此方向浮向屏幕中心 */
  origin?: DOMRect | null
  /**
   * 点赞态由外部持有：卡片和弹窗是同一条内容的两个视图，
   * 弹窗自己存一份的话，关掉再打开就会退回未点赞、而数字仍是加过的。
   */
  liked?: boolean
}>()
const emit = defineEmits<{ close: []; like: [] }>()

/* 收藏、评论、关注都要求登录；点赞的门禁在 useLikes 里，那边是数据源 */
const { requireLogin } = useAuthGuard()

/** 位移只取真实距离的这个比例：全程照搬会甩出屏幕，看着像被扔进来 */
const TRAVEL_RATIO = 0.28
/** 单方向最大位移，防止边角卡片的入场幅度过大 */
const TRAVEL_MAX = 160

function clampTravel(value: number) {
  return Math.max(-TRAVEL_MAX, Math.min(TRAVEL_MAX, value * TRAVEL_RATIO))
}

/**
 * 把「卡片中心 → 屏幕中心」的方向写成 CSS 变量，入场从该偏移滑到 0。
 * 左侧的卡片于是由左向右浮出，右侧反之，动作和点击位置对得上。
 */
const travelStyle = computed(() => {
  const rect = props.origin
  if (!rect) return { '--travel-x': '0px', '--travel-y': '0px' }
  const dx = rect.left + rect.width / 2 - window.innerWidth / 2
  const dy = rect.top + rect.height / 2 - window.innerHeight / 2
  return {
    '--travel-x': `${clampTravel(dx)}px`,
    '--travel-y': `${clampTravel(dy)}px`,
  }
})

const open = computed(() => props.detail !== null)

/** 图集为空时退回封面，保证至少有一张 */
const images = computed(() => {
  const list = props.detail?.images ?? []
  if (list.length > 0) return list
  return props.detail?.cover ? [props.detail.cover] : []
})

/*
 * H5 只提供浏览：评论框不渲染，点赞/收藏点了改为引导去小程序。
 * 断点取全局的移动端断点，不用弹窗自己那条 900px 的排版断点 ——
 * 「能不能互动」是产品规则，跟弹窗上下堆叠还是左右分栏无关。
 */
const { isMobile } = useLayoutMode()
const interactive = computed(() => !isMobile.value)

/** 小程序链接未配置时的兜底提示，显示一小会儿自动收起 */
const mpHint = ref(false)
let mpHintTimer: ReturnType<typeof setTimeout> | undefined

function openMiniProgram() {
  if (MINIPROGRAM_URL) {
    window.location.href = MINIPROGRAM_URL
    return
  }
  mpHint.value = true
  clearTimeout(mpHintTimer)
  mpHintTimer = setTimeout(() => (mpHint.value = false), 3600)
}

/*
 * 评论输入交给 ContentCommentComposer：自适应高度、表情面板、撰写态进退都在它内部。
 * 这里只留两件与弹窗相关的事 —— 撰写时收起右侧互动图标（写字的时候那四项既用不上
 * 又在抢横向空间），以及把 Esc 先交给它处理。
 */
const composer = ref<InstanceType<typeof ContentCommentComposer> | null>(null)
const composing = ref(false)

/**
 * 收到一条新评论。输入框已自行清空并收起。
 * TODO: 接口就绪后在这里提交，并把返回的评论插到列表头部、评论数 +1。
 */
function sendComment(_text: string) {}

/** H5 上评论最多露这么几条，其余引导去小程序看 */
const MOBILE_COMMENT_LIMIT = 5

const comments = computed(() => {
  const list = props.detail?.comments ?? []
  return interactive.value ? list : list.slice(0, MOBILE_COMMENT_LIMIT)
})

/*
 * 还有没有没露出来的评论。判断依据是总数而不是本次返回的条数 ——
 * 列表本身也只是一页数据，桌面端同样存在「后面还有」的情况，
 * 只是那里靠继续下拉加载，H5 则一律交给小程序。
 */
const hasMoreComments = computed(
  () => !interactive.value && (props.detail?.commentCount ?? 0) > comments.value.length,
)

const index = ref(0)
const collected = ref(false)

function onLike() {
  if (!interactive.value) return openMiniProgram()
  emit('like')
}

function onCollect() {
  if (!interactive.value) return openMiniProgram()
  if (!requireLogin('收藏')) return
  collected.value = !collected.value
}

const following = ref(false)

function onFollow() {
  if (!requireLogin('关注')) return
  following.value = !following.value
}

/** 到头即停，不循环 —— 图集是有限的一组，绕回第一张会让人以为漏看了 */
function go(next: number) {
  const count = images.value.length
  if (count > 0) index.value = Math.max(0, Math.min(count - 1, next))
}

const atFirst = computed(() => index.value === 0)
const atLast = computed(() => index.value >= images.value.length - 1)

function close() {
  emit('close')
}

/**
 * 两次滚轮翻页之间的最小间隔：触控板一次滑动会连发几十个 wheel 事件。
 * 取值与轨道平移时长对齐，前一张还在滑就不接下一次，避免动画被打断成跳帧。
 */
const WHEEL_COOLDOWN = 380
/** 累计滚动量阈值，滤掉轻微的误触 */
const WHEEL_THRESHOLD = 24
let wheelAt = 0

function onGalleryWheel(event: WheelEvent) {
  if (images.value.length < 2) return
  if (Math.abs(event.deltaY) < WHEEL_THRESHOLD) return
  const now = event.timeStamp
  if (now - wheelAt < WHEEL_COOLDOWN) return
  wheelAt = now
  go(index.value + (event.deltaY > 0 ? 1 : -1))
}

/*
 * 计数为 0 时底部操作条不显示数字 —— 一排「0」会让内容看着很冷清，留白反而干净。
 * detail 为 null 时兜 0：弹窗此刻不渲染，但 computed 仍会求值。
 * 点赞数不在这里 +1，外部 toggle 已经改过列表项，再加一次就翻倍了。
 */
const likeCount = computed(() => props.detail?.likes ?? 0)
const collectCount = computed(() => (props.detail?.collects ?? 0) + (collected.value ? 1 : 0))
const commentCount = computed(() => props.detail?.commentCount ?? 0)

/** Esc 先给输入框：它要用来收表情面板、退撰写态，都不用时才轮到关弹窗 */
function onEscape() {
  return composer.value?.escape() ?? false
}

// 左右方向键翻图；光标在输入框里时左右键归输入框，不能拿去翻页
function onArrowKey(event: KeyboardEvent) {
  if (composing.value) return
  if (event.key === 'ArrowLeft') go(index.value - 1)
  if (event.key === 'ArrowRight') go(index.value + 1)
}

// 滚动锁、Esc、点遮罩关闭都在 useOverlay 里，三个弹层共用一套规则
const { onOverlayPointerDown, onOverlayClick } = useOverlay(open, {
  close,
  onEscape,
  onKeydown: onArrowKey,
})

/*
 * H5 上把弹窗接进浏览器历史：打开时压一条记录，系统返回手势/返回键先关弹窗，
 * 而不是直接退出整个页面。桌面端不做 —— 那里有遮罩和 Esc 可退，
 * 再劫持返回键反而会让「后退」偏离用户预期。
 */
let historyPushed = false

function onPopState() {
  // 这条记录已经被系统弹掉了，只需关弹窗，不能再调 history.back()
  historyPushed = false
  window.removeEventListener('popstate', onPopState)
  close()
}

function pushHistory() {
  window.history.pushState({ ...window.history.state, acgnparkDialog: true }, '')
  historyPushed = true
  window.addEventListener('popstate', onPopState)
}

/** 由界面关闭时，把打开时压进去的那条记录退掉，免得历史里堆一串空记录 */
function popHistory() {
  window.removeEventListener('popstate', onPopState)
  if (!historyPushed) return
  historyPushed = false
  window.history.back()
}

watch(open, (value) => {
  if (value) {
    if (isMobile.value) pushHistory()
    // 每次打开都从第一张开始，避免残留上一条内容的状态（点赞态由外部维护，不必重置）
    index.value = 0
    collected.value = false
    following.value = false
    // 草稿不留到下一条内容上
    composer.value?.reset()
    return
  }
  popHistory()
})

onScopeDispose(() => {
  window.removeEventListener('popstate', onPopState)
  clearTimeout(mpHintTimer)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="pop">
      <div
        v-if="detail"
        class="overlay"
        @pointerdown="onOverlayPointerDown"
        @click="onOverlayClick"
      >
        <div
          class="dialog"
          role="dialog"
          aria-modal="true"
          :aria-label="detail.title"
          :style="travelStyle"
        >
          <!--
            返回按钮只在 H5 出现：那里弹窗铺满全屏，没有遮罩可点、也没有 Esc 可按，
            光靠系统返回键不够明显。桌面端点遮罩或按 Esc 即可，不必多这一个。
          -->
          <button
            v-if="!interactive"
            class="back"
            type="button"
            aria-label="返回"
            @click="close"
          >
            <AppIcon name="chevronLeft" :size="22" />
          </button>

          <!-- ── 左：图集 ── -->
          <!-- 滚轮在图区上翻页；prevent 是必须的，否则滚动会穿透到下层页面 -->
          <div class="gallery" @wheel.prevent="onGalleryWheel">
            <!--
              整条轨道横向平移，而不是换 img 的 src ——
              换 src 是瞬间替换，没有过程；平移才有连续的滑动感，
              且箭头、圆点、滚轮三种操作共用同一段动画。
            -->
            <div class="gallery__track" :style="{ translate: `${index * -100}% 0` }">
              <div v-for="image in images" :key="image" class="gallery__cell">
                <img class="gallery__img" :src="image" :alt="detail.title" />
              </div>
            </div>

            <template v-if="images.length > 1">
              <button
                class="gallery__arrow gallery__arrow--prev"
                type="button"
                aria-label="上一张"
                :disabled="atFirst"
                @click="go(index - 1)"
              >
                <AppIcon name="chevronLeft" :size="20" />
              </button>
              <button
                class="gallery__arrow gallery__arrow--next"
                type="button"
                aria-label="下一张"
                :disabled="atLast"
                @click="go(index + 1)"
              >
                <AppIcon name="chevronRight" :size="20" />
              </button>

              <div class="gallery__dots">
                <button
                  v-for="(image, i) in images"
                  :key="image"
                  class="gallery__dot"
                  :class="{ 'gallery__dot--active': i === index }"
                  type="button"
                  :aria-label="`第 ${i + 1} 张`"
                  :aria-current="i === index"
                  @click="go(i)"
                />
              </div>
            </template>
          </div>

          <!-- ── 右：信息与评论 ── -->
          <div class="side">
            <header class="author">
              <img
                v-if="detail.avatar"
                class="author__avatar"
                :src="detail.avatar"
                :alt="detail.author"
              />
              <span v-else class="author__avatar author__avatar--text" aria-hidden="true">
                {{ detail.author.slice(0, 1) }}
              </span>
              <span class="author__name">{{ detail.author }}</span>

              <!-- H5 只做展示与引导，关注同样收起 -->
              <button
                v-if="interactive"
                class="follow"
                :class="{ 'follow--on': following }"
                type="button"
                @click="onFollow"
              >
                {{ following ? '已关注' : '关注' }}
              </button>
            </header>

            <!-- 正文与评论同处一个滚动区，与主流社区一致 -->
            <div class="scroll">
              <h2 class="post__title">{{ detail.title }}</h2>
              <p v-if="detail.desc" class="post__desc">{{ detail.desc }}</p>

              <p v-if="detail.tags?.length" class="post__tags">
                <span v-for="tag in detail.tags" :key="tag" class="post__tag">#{{ tag }}</span>
              </p>

              <p v-if="detail.date" class="post__date">{{ detail.date }}</p>

              <div class="comments">
                <!-- 一条都没有时不报「共 0 条评论」，直接换成一句邀请 -->
                <p v-if="commentCount > 0" class="comments__count">
                  共 {{ formatCount(commentCount) }} 条评论
                </p>

                <p v-else class="comments__empty">
                  <AppIcon name="comment" :size="28" />
                  快来抢沙发，评论吧！
                </p>

                <ul v-if="comments.length" class="comments__list">
                  <li v-for="comment in comments" :key="comment.id">
                    <!-- 一条评论与它的回复共用同一套结构，回复只是缩进一层 -->
                    <div class="comment">
                      <img
                        v-if="comment.avatar"
                        class="comment__avatar"
                        :src="comment.avatar"
                        :alt="comment.author"
                      />
                      <span v-else class="comment__avatar comment__avatar--text" aria-hidden="true">
                        {{ comment.author.slice(0, 1) }}
                      </span>

                      <div class="comment__main">
                        <p class="comment__head">
                          <span class="comment__author">{{ comment.author }}</span>
                          <span v-if="comment.isAuthor" class="comment__badge">作者</span>
                        </p>
                        <p class="comment__text">{{ comment.text }}</p>
                        <p class="comment__meta">
                          <span>{{ comment.date }}</span>
                          <span v-if="comment.region">{{ comment.region }}</span>
                          <span class="comment__act">
                            <AppIcon name="heart" :size="13" />
                            {{ comment.likes || '赞' }}
                          </span>
                          <span class="comment__act">
                            <AppIcon name="comment" :size="13" />
                            回复
                          </span>
                        </p>

                        <ul v-if="comment.replies?.length" class="comment__replies">
                          <li v-for="reply in comment.replies" :key="reply.id" class="comment">
                            <img
                              v-if="reply.avatar"
                              class="comment__avatar"
                              :src="reply.avatar"
                              :alt="reply.author"
                            />
                            <span
                              v-else
                              class="comment__avatar comment__avatar--text"
                              aria-hidden="true"
                            >
                              {{ reply.author.slice(0, 1) }}
                            </span>

                            <div class="comment__main">
                              <p class="comment__head">
                                <span class="comment__author">{{ reply.author }}</span>
                                <span v-if="reply.isAuthor" class="comment__badge">作者</span>
                              </p>
                              <p class="comment__text">{{ reply.text }}</p>
                              <p class="comment__meta">
                                <span>{{ reply.date }}</span>
                                <span v-if="reply.region">{{ reply.region }}</span>
                                <span class="comment__act">
                                  <AppIcon name="heart" :size="13" />
                                  {{ reply.likes || '赞' }}
                                </span>
                                <span class="comment__act">
                                  <AppIcon name="comment" :size="13" />
                                  回复
                                </span>
                              </p>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </li>
                </ul>

                <!-- H5 只露前几条，其余去小程序看 -->
                <button
                  v-if="hasMoreComments"
                  class="comments__more"
                  type="button"
                  @click="openMiniProgram"
                >
                  {{ MINIPROGRAM_COMMENTS_CTA }}
                  <AppIcon name="chevronRight" :size="16" />
                </button>
              </div>
            </div>

            <!-- 底部操作条：桌面端是评论输入 + 互动计数；H5 换成小程序引导 -->
            <footer class="bar">
              <ContentCommentComposer
                v-if="interactive"
                ref="composer"
                v-model:composing="composing"
                @send="sendComment"
              />

              <button v-else class="bar__mp" type="button" @click="openMiniProgram">
                {{ MINIPROGRAM_CTA }}
              </button>

              <!-- 四项包一层：组内间距比「输入框↔图标组」的间距小，读起来才是一组 -->
              <div v-if="!composing" class="bar__acts">
                <button
                  class="bar__act"
                  :class="{ 'bar__act--liked': liked }"
                  type="button"
                  :aria-pressed="liked"
                  aria-label="点赞"
                  @click="onLike"
                >
                  <AppIcon name="heart" :size="20" />
                  <span v-if="likeCount > 0" class="bar__num">{{ formatCount(likeCount) }}</span>
                </button>

                <button
                  class="bar__act"
                  :class="{ 'bar__act--collected': collected }"
                  type="button"
                  :aria-pressed="collected"
                  aria-label="收藏"
                  @click="onCollect"
                >
                  <AppIcon name="star" :size="20" />
                  <span v-if="collectCount > 0" class="bar__num">
                    {{ formatCount(collectCount) }}
                  </span>
                </button>

                <!-- 评论没有本地态可加，为 0 时用「评论」二字替代数字，提示这里可以留言 -->
                <span class="bar__act bar__act--static">
                  <AppIcon name="comment" :size="20" />
                  <span class="bar__num">
                    {{ commentCount > 0 ? formatCount(commentCount) : '评论' }}
                  </span>
                </span>

                <!-- H5 宽度紧张，分享先收起，转发由小程序承担 -->
                <button v-if="interactive" class="bar__act" type="button" aria-label="分享">
                  <AppIcon name="share" :size="20" />
                </button>
              </div>

              <!-- 小程序链接未配置时的兜底提示，浮在操作条上方 -->
              <Transition name="hint">
                <p v-if="mpHint" class="bar__hint">
                  <AppIcon name="info" :size="18" />
                  {{ MINIPROGRAM_FALLBACK_HINT }}
                </p>
              </Transition>
            </footer>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  z-index: var(--z-modal);
  display: grid;
  padding: var(--space-5);
  background: var(--color-overlay);
  inset: 0;
  place-items: center;
}

.dialog {
  position: relative;
  display: grid;
  width: 100%;
  max-width: 1080px;
  height: 100%;
  max-height: 760px;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
  /* 图区自适应，信息栏定宽 —— 评论行宽固定才好读 */
  grid-template-columns: minmax(0, 1fr) 400px;
}

/*
 * 浮在图区左上角。图片深浅不定，所以垫一层半透明黑底，
 * 白色箭头在亮图上也看得见；top 从安全区起算，避开刘海和状态栏。
 */
.back {
  position: absolute;
  top: calc(var(--safe-top) + var(--space-3));
  left: var(--space-3);
  z-index: 2;
  display: grid;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-full);
  background: var(--color-scrim);
  color: var(--color-on-scrim);
  place-items: center;
}

/* ── 图集 ── */
.gallery {
  position: relative;
  overflow: hidden;
  background: var(--color-media-bg);
}

.gallery__track {
  display: flex;
  width: 100%;
  height: 100%;
  transition: translate 380ms var(--ease);
  will-change: translate;
}

.gallery__cell {
  display: grid;
  width: 100%;
  height: 100%;
  flex: 0 0 100%;
  place-items: center;
}

.gallery__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.gallery__arrow {
  position: absolute;
  top: 50%;
  display: grid;
  width: 34px;
  height: 34px;
  translate: 0 -50%;
  border-radius: var(--radius-full);
  background: var(--color-scrim);
  color: var(--color-on-scrim);
  backdrop-filter: blur(4px);
  opacity: 0;
  place-items: center;
  pointer-events: none;
  transition: opacity var(--duration) var(--ease), background var(--duration) var(--ease);
}

.gallery__arrow:hover {
  background: var(--color-scrim-hover);
}

/* 首/末张时对应箭头置灰不可点，明确「到头了」 */
.gallery__arrow:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.gallery:hover .gallery__arrow:disabled,
.gallery:focus-within .gallery__arrow:disabled {
  opacity: 0.35;
}

.gallery__arrow--prev {
  left: var(--space-3);
}

.gallery__arrow--next {
  right: var(--space-3);
}

.gallery:hover .gallery__arrow,
.gallery:focus-within .gallery__arrow {
  opacity: 1;
  pointer-events: auto;
}

/* 左右拉满再靠 justify-content 居中，不用 left+translate，免得和圆点自身的动画抢 transform */
.gallery__dots {
  position: absolute;
  right: 0;
  bottom: var(--space-4);
  left: 0;
  display: flex;
  gap: var(--space-1);
  justify-content: center;
}

.gallery__dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-on-scrim-muted);
  transition: width var(--duration) var(--ease), background var(--duration) var(--ease);
}

.gallery__dot--active {
  width: 16px;
  background: var(--color-on-scrim);
}

/* ── 右栏 ── */
/*
 * 不透明并盖在图区之上。入场时弹窗在做 scale 动画，两列的分界会落在半个像素上，
 * 图区那块深底会顺着这条缝渗到分界线右侧 —— 看着就是一条黑色竖线闪一下，
 * 动画停在 scale(1)、像素重新对齐后又消失。让信息栏自己有底色并抬一层，
 * 缝里露出的就是面板色而不是深底。
 */
.side {
  position: relative;
  z-index: 1;
  /*
   * 往左压 1px 盖住分界那一列像素。仅靠层级不够：缩放时两列的边界落在半个像素上，
   * 那一个像素是图区深底与信息栏底色的混合，于是显出一条深色竖线；
   * 动画停在 scale(1) 后像素重新对齐，线又消失，所以只闪一下。
   * 压 1px 让这列像素完全由信息栏绘制，混合就不存在了。
   */
  margin-left: -1px;
  background: var(--color-bg-elevated);
  display: flex;
  min-width: 0;
  /* 允许内部滚动区收缩，否则 .scroll 会被内容撑高、滚动条落不到它身上 */
  min-height: 0;
  flex-direction: column;
  border-left: 1px solid var(--color-border);
}

.author {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-4) var(--space-5);
  flex-shrink: 0;
}

.author__avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  object-fit: cover;
}

.author__avatar--text {
  display: grid;
  background: var(--color-brand-soft);
  color: var(--color-brand);
  font-weight: 600;
  place-items: center;
}

.author__name {
  overflow: hidden;
  font-size: var(--font-md);
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.follow {
  height: var(--control-height);
  /*
   * 定死最小宽度：「关注」两个字、「已关注」三个字，不定宽的话切换瞬间按钮会窄一下或宽一下，
   * 而它靠 margin-left: auto 贴右，宽度变化全部体现在左边缘上 —— 看着就是按钮在原地抽一下。
   */
  min-width: 76px;
  margin-left: auto;
  padding: 0 var(--space-4);
  flex-shrink: 0;
  /* 两态都留 1px 边框，只换颜色。只给「已关注」加边框会让盒子高一圈，切换时整行跟着跳 */
  border: 1px solid transparent;
  border-radius: var(--radius-full);
  background: var(--color-accent);
  color: var(--color-text-inverse);
  font-size: var(--font-sm);
  font-weight: 500;
  transition: background var(--duration) var(--ease), color var(--duration) var(--ease),
    border-color var(--duration) var(--ease);
}

.follow:hover {
  background: var(--color-accent-hover);
}

/* 已关注是次要态：实心降为描边，避免和「关注」一样抢眼 */
.follow--on {
  border-color: var(--color-border-strong);
  background: none;
  color: var(--color-text-secondary);
}

/* 次要态也要有反馈，否则鼠标压上去毫无反应，像是点不动 */
.follow--on:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.scroll {
  min-height: 0;
  flex: 1;
  padding: var(--space-5);
  overflow-y: auto;
  /* 评论滚到底后不把滚动传给下层页面 */
  overscroll-behavior: contain;
  /*
   * 隐藏滚动条但保留滚动能力：弹窗宽度固定，一条滚动条会把正文挤窄一截，
   * 且它紧贴右边框，视觉上像多了一道描边。滚动仍可用滚轮/触控板/键盘完成。
   */
  scrollbar-width: none;
}

.scroll::-webkit-scrollbar {
  display: none;
}

.post__title {
  overflow-wrap: break-word;
  font-size: var(--font-lg);
  font-weight: 600;
  line-height: 1.4;
}

.post__desc {
  margin-top: var(--space-2);
  font-size: var(--font-sm);
  line-height: 1.6;
  /* 正文里的换行是作者自己分的段，要保留；连续空格仍然合并 */
  white-space: pre-line;
  /* 长串英文/链接不至于把信息栏撑破 */
  overflow-wrap: break-word;
}

.post__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

/* 标签用品牌色，是站内可跳转的话题 */
.post__tag {
  color: var(--color-brand);
  font-size: var(--font-sm);
  cursor: pointer;
}

.post__date {
  margin-top: var(--space-3);
  color: var(--color-text-tertiary);
  font-size: var(--font-xs);
}

.comments {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
}

/*
 * 空评论态：占一块高度撑在评论区中间。
 * 不用 flex 居中于整个滚动区 —— 正文长短不一，那样会把这句话推到看不见的位置，
 * 固定一段上下留白反而稳定：正文短时它在视觉中心，正文长时它就在正文之后。
 */
.comments__empty {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: center;
  justify-content: center;
  padding: var(--space-10) 0;
  color: var(--color-text-tertiary);
  font-size: var(--font-sm);
  text-align: center;
}

.comments__count {
  color: var(--color-text-tertiary);
  font-size: var(--font-sm);
}

/*
 * 「查看更多」不做成实心按钮：底部已经有一个小程序引导的主按钮，
 * 两个同样醒目的红块会互相抢，这里用文字链的分量就够。
 */
.comments__more {
  display: flex;
  gap: var(--space-1);
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: var(--space-4);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-bg-sunken);
  color: var(--color-accent);
  font-size: var(--font-sm);
  font-weight: 500;
}

.comments__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.comment {
  display: flex;
  gap: var(--space-3);
}

.comment__avatar {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  object-fit: cover;
}

.comment__avatar--text {
  display: grid;
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
  font-size: var(--font-xs);
  font-weight: 600;
  place-items: center;
}

.comment__main {
  min-width: 0;
  flex: 1;
}

.comment__head {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.comment__author {
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
}

.comment__badge {
  padding: 1px var(--space-1);
  border-radius: var(--radius-sm);
  background: var(--color-bg-hover);
  color: var(--color-text-tertiary);
  font-size: 11px;
}

.comment__text {
  margin-top: 2px;
  font-size: var(--font-sm);
  line-height: 1.55;
  word-break: break-word;
}

.comment__meta {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  margin-top: var(--space-1);
  color: var(--color-text-tertiary);
  font-size: var(--font-xs);
}

.comment__act {
  display: flex;
  gap: 3px;
  align-items: center;
  cursor: pointer;
  transition: color var(--duration) var(--ease);
}

.comment__act:hover {
  color: var(--color-text-secondary);
}

.comment__replies {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-3);
}

/* ── 底部操作条 ── */
.bar {
  position: relative;
  display: flex;
  gap: var(--space-4);
  /* 输入框长高时，右侧那排图标留在底边，不跟着往上飘 */
  align-items: flex-end;
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

/* H5 的小程序引导：占掉评论框的位置，是这条操作条上唯一的主动作 */
.bar__mp {
  min-width: 0;
  flex: 1;
  height: 36px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-full);
  background: var(--color-accent);
  color: var(--color-text-inverse);
  font-size: var(--font-sm);
  font-weight: 600;
  white-space: nowrap;
  transition: background var(--duration) var(--ease);
}

.bar__mp:hover {
  background: var(--color-accent-hover);
}

/*
 * 提示浮在操作条上方，不挤动布局。
 * 用品牌红实心 + 正文字号：这是引导话术而不是错误提示，
 * 之前的小字灰底容易被当成占位文本直接忽略。
 */
.bar__hint {
  position: absolute;
  right: var(--space-4);
  bottom: calc(100% + var(--space-3));
  left: var(--space-4);
  display: flex;
  gap: var(--space-2);
  align-items: center;
  justify-content: center;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-accent);
  color: var(--color-text-inverse);
  font-size: var(--font-sm);
  font-weight: 500;
  line-height: 1.4;
  text-align: center;
}

/* 从下方推上来，比单纯淡入更容易被注意到 */
.hint-enter-active,
.hint-leave-active {
  transition: opacity var(--duration) var(--ease), translate var(--duration) var(--ease);
}

.hint-enter-from,
.hint-leave-to {
  opacity: 0;
  translate: 0 var(--space-3);
}

.bar__acts {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  flex-shrink: 0;
}

/*
 * 与输入框同高并居中，四项的图标就都落在同一条中线上；
 * 最后的分享只有图标、没有数字，靠 min-width 补出与前三项相当的点击区，
 * 不然它的热区会明显窄一截，看着像挤到了右边缘。
 */
.bar__act {
  display: flex;
  gap: var(--space-1);
  min-width: 24px;
  height: 36px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color var(--duration) var(--ease);
}

/*
 * 数字单独一层：line-height 归 1 才能让数字的视觉中心与图标中心重合，
 * 默认行高会在字下方留出一段空白，把数字顶得比图标高。
 * 等宽数字保证点赞 +1 时整条不跟着抖。
 */
.bar__num {
  font-size: var(--font-xs);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

/*
 * 描边加粗一档。stroke-width 在 AppIcon 里是 presentation attribute，
 * CSS 的优先级高于它，所以这里能直接覆盖，不必给组件加 prop。
 */
.bar__act :deep(.app-icon) {
  stroke-width: 2;
}

.bar__act:hover {
  color: var(--color-text);
}

/* 评论数只是展示，不是按钮，别给手型 */
.bar__act--static {
  cursor: default;
}

.bar__act--static:hover {
  color: var(--color-text-secondary);
}

.bar__act--liked,
.bar__act--liked:hover {
  color: var(--color-like);
}

.bar__act--liked :deep(.app-icon),
.bar__act--collected :deep(.app-icon) {
  fill: currentColor;
}

.bar__act--collected,
.bar__act--collected:hover {
  color: var(--color-collect);
}

/*
 * 入场：从触发卡片所在的方向滑向屏幕中心，同时放大。
 * 位移量由 --travel-x/y 给出（脚本按卡片位置算），关闭时沿原路退回。
 * 时长比通用 --duration 长一档，位移动作太快会看不出方向。
 */
.pop-enter-active,
.pop-leave-active {
  transition: opacity 300ms var(--ease);
}

/*
 * 退场期间遮罩还在 DOM 里，不放开点击的话这 300ms 内点卡片全被它吃掉 ——
 * 表现就是「关掉弹窗后要等一下才点得开下一张」。
 */
.pop-leave-active {
  pointer-events: none;
}

.pop-enter-active .dialog,
.pop-leave-active .dialog {
  transition: translate 300ms var(--ease), scale 300ms var(--ease), opacity 300ms var(--ease);
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
}

.pop-enter-from .dialog,
.pop-leave-to .dialog {
  translate: var(--travel-x) var(--travel-y);
  scale: 0.92;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .pop-enter-active .dialog,
  .pop-leave-active .dialog,
  .gallery__track {
    transition: none;
  }
}

/* 触屏没有悬停，靠圆点和滑动切换 */
@media (hover: none) {
  .gallery__arrow {
    display: none;
  }
}

/* 窄屏改上下布局：图在上、信息与评论在下 */
@media (max-width: 900px) {
  .overlay {
    padding: 0;
  }

  .dialog {
    max-width: none;
    max-height: none;
    border-radius: 0;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: 45% minmax(0, 1fr);
  }

  /* 上下布局时缝在水平方向，压 1px 的方向也跟着换 */
  .side {
    margin-left: 0;
    margin-top: -1px;
    border-left: none;
    border-top: 1px solid var(--color-border);
  }

  .author {
    padding: var(--space-3) var(--space-4);
  }
}
</style>
