<script setup lang="ts">
/**
 * 登录弹窗。开合状态读 auth store，任何位置调 openLoginDialog() 都能唤起。
 * 表单目前只有交互（校验、倒计时），提交动作接的是 store 里的假登录，
 * 接入真实接口后只需替换 auth.login 的内部实现。
 */
import { computed, onScopeDispose, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import AppIcon from '@/components/base/AppIcon.vue'
import { useOverlay } from '@/composables/useOverlay'
import { useAuthStore } from '@/stores/auth'
import { LOGIN_BANNER, LOGIN_QRCODE_URL } from '@/config/site'
import wechatScannerIcon from '@/assets/wechat_scanner.svg'

/** 验证码倒计时秒数 */
const RESEND_SECONDS = 60

const auth = useAuthStore()
const { loginDialogOpen: open } = storeToRefs(auth)

const phone = ref('')
const code = ref('')
const agreed = ref(true)
const countdown = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

const phoneValid = computed(() => /^1\d{10}$/.test(phone.value))
const canSubmit = computed(() => phoneValid.value && code.value.length > 0 && agreed.value)

function stopCountdown() {
  clearInterval(timer)
  timer = undefined
}

/** TODO: 接入短信接口，失败时把倒计时重置 */
function sendCode() {
  if (!phoneValid.value || countdown.value > 0) return
  countdown.value = RESEND_SECONDS
  stopCountdown()
  timer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) stopCountdown()
  }, 1000)
}

function submit() {
  if (!canSubmit.value) return
  // TODO: 换成 auth.loginByPhone(phone, code)
  auth.login()
}

function close() {
  auth.closeLoginDialog()
}

// 滚动锁、Esc、点遮罩关闭都在 useOverlay 里，三个弹层共用一套规则
const { onOverlayPointerDown, onOverlayClick } = useOverlay(open, { close })

watch(open, (value) => {
  if (value) return
  /*
   * 关闭时把焦点从触发按钮上摘掉。
   * 弹窗打开期间焦点一直留在「登录/注册」按钮上，按 Esc 关闭属于键盘操作，
   * 浏览器会给它画 :focus-visible 焦点圈，看着像按钮凭空多了一层描边。
   */
  const active = document.activeElement
  if (active instanceof HTMLElement) active.blur()
  // 关闭即清空，避免下次打开残留上一次的输入
  phone.value = ''
  code.value = ''
  countdown.value = 0
  stopCountdown()
})

onScopeDispose(stopCountdown)
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="overlay"
        @pointerdown="onOverlayPointerDown"
        @click="onOverlayClick"
      >
        <div class="dialog" role="dialog" aria-modal="true" aria-label="登录">
          <button class="dialog__close" type="button" aria-label="关闭" @click="close">
            <AppIcon name="close" :size="18" />
          </button>

          <!-- 顶部运营位：文案已在图里，图未配置时留渐变兜底 -->
          <div class="banner">
            <img v-if="LOGIN_BANNER.image" class="banner__img" :src="LOGIN_BANNER.image" alt="" />
          </div>

          <div class="body">
            <!-- 左：手机号登录 -->
            <form class="pane" @submit.prevent="submit">
              <h2 class="pane__title">手机号登录</h2>

              <div class="field">
                <span class="field__prefix">+86</span>
                <input
                  v-model.trim="phone"
                  class="field__input"
                  type="tel"
                  inputmode="numeric"
                  maxlength="11"
                  placeholder="请输入手机号"
                  aria-label="手机号"
                />
              </div>

              <div class="field">
                <input
                  v-model.trim="code"
                  class="field__input"
                  inputmode="numeric"
                  maxlength="6"
                  placeholder="请输入验证码"
                  aria-label="验证码"
                />
                <button
                  class="field__action"
                  type="button"
                  :disabled="!phoneValid || countdown > 0"
                  @click="sendCode"
                >
                  {{ countdown > 0 ? `${countdown}s 后重发` : '获取验证码' }}
                </button>
              </div>

              <button class="submit" type="submit" :disabled="!canSubmit">登录/注册</button>
            </form>

            <!-- 右：扫码登录 -->
            <div class="pane pane--qr">
              <h2 class="pane__title">
                可使用
                <img class="pane__logo" :src="wechatScannerIcon" alt="" />
                <strong>微信</strong>
                扫码登陆
              </h2>

              <!-- 与左栏表单等高，二维码在余下空间里居中，两栏标题和底边都对齐 -->
              <div class="scan">
                <img
                  v-if="LOGIN_QRCODE_URL"
                  class="qr"
                  :src="LOGIN_QRCODE_URL"
                  alt="微信登录二维码"
                />
                <div v-else class="qr qr--empty">二维码</div>

                <p class="pane__hint">新用户可直接登录</p>
              </div>
            </div>
          </div>

          <!--
            勾选框的 label 只包住「我已阅读并同意」这几个字，两个协议链接放在 label 之外 ——
            链接若在 label 内，浏览器会把悬停算作对 label 的悬停，连带点亮勾选框。
          -->
          <footer class="legal">
            <input id="login-agree" v-model="agreed" type="checkbox" />
            <label for="login-agree">我已阅读并同意</label>
            <RouterLink :to="{ name: 'terms' }" target="_blank">《用户协议》</RouterLink>
            <RouterLink :to="{ name: 'privacy' }" target="_blank">《隐私政策》</RouterLink>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  /* 压在其他弹窗之上：详情弹窗里点评论/收藏都会唤起它 */
  z-index: var(--z-modal-top);
  display: grid;
  padding: var(--space-4);
  background: var(--color-overlay);
  inset: 0;
  place-items: center;
}

.dialog {
  position: relative;
  width: 100%;
  /* 右栏定宽，弹窗总宽收窄等于收窄左栏表单 —— 输入框铺得太长不好按 */
  max-width: 620px;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
}

.dialog__close {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  z-index: 2;
  display: grid;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-full);
  background: var(--color-scrim);
  color: var(--color-on-scrim);
  place-items: center;
  transition: background var(--duration) var(--ease);
}

.dialog__close:hover {
  background: var(--color-scrim-hover);
}

/* ── 顶部运营位 ── */
/* 用图片自身比例定高，弹窗变窄时整图等比缩放，不裁切文案 */
.banner {
  aspect-ratio: 1240 / 264;
  /* 图未配置时的兜底：品牌红做深浅两档渐变（brand 与 accent 现在同源，不能再拿来拉开对比） */
  background: linear-gradient(120deg, var(--color-brand-hover), var(--color-brand));
}

.banner__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ── 主体：左右两栏，中间竖分隔 ── */
/*
 * 两栏不等宽：左栏表单铺满整列，右栏只有 148 的二维码居中，
 * 若两列等宽，右侧会凭空多出半个二维码的留白，分隔线看着就偏左。
 * 改成右栏按内容取宽（下方定宽），左栏吃掉剩余，分隔线两侧空白才对称。
 */
.body {
  display: grid;
  gap: var(--space-6);
  padding: var(--space-6);
  grid-template-columns: minmax(0, 1fr) 1px auto;
}

/* 分隔线用一列宽度画，避免 border 影响两栏等宽 */
.body::before {
  background: var(--color-border);
  content: '';
  grid-area: 1 / 2;
}

.pane {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-3);
}

.pane:first-child {
  grid-area: 1 / 1;
}

/* 定宽 = 二维码 148 + 两侧各约一个 space-4，标题长度变化时不会挤动左栏 */
.pane--qr {
  width: 216px;
  align-items: center;
  grid-area: 1 / 3;
}

.scan {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-3);
  align-items: center;
  justify-content: center;
}

.pane__title {
  margin-bottom: var(--space-1);
  font-size: var(--font-lg);
  font-weight: 600;
  text-align: center;
}

/* 「可使用 微信 扫码登陆」：图标与文字同一行居中，微信二字再重一档 */
.pane--qr .pane__title {
  display: flex;
  gap: var(--space-1);
  align-items: center;
  justify-content: center;
  font-weight: 500;
}

.pane__logo {
  display: block;
  width: 18px;
  height: 18px;
}

.pane--qr .pane__title strong {
  font-weight: 700;
}

.pane__hint {
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
}

/* ── 表单 ── */
.field {
  display: flex;
  align-items: center;
  height: 44px;
  padding-left: var(--space-4);
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--color-bg-sunken);
}

.field__prefix {
  padding-right: var(--space-3);
  border-right: 1px solid var(--color-border-strong);
  color: var(--color-text-secondary);
  font-size: var(--font-md);
}

.field__input {
  min-width: 0;
  flex: 1;
  height: 100%;
  padding: 0 var(--space-3);
  border: none;
  background: none;
  color: var(--color-text);
  font: inherit;
  outline: none;
}

.field__input::placeholder {
  color: var(--color-text-tertiary);
}

.field__action {
  height: 100%;
  flex-shrink: 0;
  padding: 0 var(--space-4);
  border-left: 1px solid var(--color-border-strong);
  color: var(--color-accent);
  font-size: var(--font-sm);
  white-space: nowrap;
}

.field__action:disabled {
  color: var(--color-text-tertiary);
  cursor: not-allowed;
}

.submit {
  height: 44px;
  margin-top: var(--space-2);
  border-radius: var(--radius-md);
  background: var(--color-accent);
  color: var(--color-text-inverse);
  font-size: var(--font-md);
  font-weight: 600;
  transition: background var(--duration) var(--ease), opacity var(--duration) var(--ease);
}

.submit:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.submit:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* ── 扫码 ── */
.qr {
  width: 148px;
  height: 148px;
  border-radius: var(--radius-sm);
  background: var(--color-qr-bg);
}

.qr--empty {
  display: grid;
  border: 1px dashed var(--color-border-strong);
  background: none;
  color: var(--color-text-tertiary);
  font-size: var(--font-sm);
  place-items: center;
}

/* ── 底部条款 ── */
.legal {
  display: flex;
  flex-wrap: wrap;
  /* 横向只留勾选框到文字的一点空隙；书名号自带留白，链接之间不再加 gap */
  gap: var(--space-1) 2px;
  align-items: center;
  justify-content: center;
  padding: 0 var(--space-6) var(--space-5);
  color: var(--color-text-tertiary);
  font-size: var(--font-xs);
}

.legal input,
.legal label {
  cursor: pointer;
}

.legal input {
  accent-color: var(--color-accent);
}

/* 协议链接：不用彩色，靠字重和正文色与说明文字拉开层次，hover 只提亮不加下划线 */
.legal a {
  color: var(--color-text-secondary);
  font-weight: 500;
  transition: color var(--duration) var(--ease);
}

.legal a:hover {
  color: var(--color-text);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--duration) var(--ease);
}

/* 退场中的遮罩不再拦点击，否则关弹窗后的一瞬间点什么都没反应 */
.fade-leave-active {
  pointer-events: none;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 移动端：只留手机号登录，扫码栏与分隔线收起 */
@media (max-width: 767px) {
  .body {
    gap: 0;
    padding: var(--space-5) var(--space-4);
    grid-template-columns: minmax(0, 1fr);
  }

  .body::before,
  .pane--qr {
    display: none;
  }

  .legal {
    padding-inline: var(--space-4);
  }
}
</style>
