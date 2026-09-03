<script setup lang="ts">
/**
 * 胶囊按钮。项目里原本有七八处各写一遍的「40 高、全圆角、主色底」按钮，
 * 尺寸和 hover 各差一点，改一次品牌色要翻七个文件，于是收成一个组件。
 *
 * 只管长相与尺寸，不管位置 —— 外边距、margin-left: auto 之类由调用方
 * 通过 class 传进来（scoped 样式会落到组件根元素上）。
 */
withDefaults(
  defineProps<{
    /**
     * primary 主动作 / ghost 取消类弱动作 / outline 次要动作 /
     * danger 二次确认里的实心红 / danger-outline 页面上的危险入口
     */
    variant?: 'primary' | 'ghost' | 'outline' | 'danger' | 'danger-outline'
    /** sm 用于卡片内的行内按钮，md 是页面级默认 */
    size?: 'sm' | 'md'
    disabled?: boolean
    /** 原生 type，表单里要 submit 时传 */
    type?: 'button' | 'submit'
  }>(),
  { variant: 'ghost', size: 'md', disabled: false, type: 'button' },
)
</script>

<template>
  <button
    class="btn"
    :class="[`btn--${variant}`, `btn--${size}`]"
    :type="type"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  gap: var(--space-1);
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  white-space: nowrap;
  cursor: pointer;
  transition: background var(--duration) var(--ease), color var(--duration) var(--ease),
    border-color var(--duration) var(--ease);
}

.btn:disabled {
  cursor: not-allowed;
}

/* ── 尺寸 ── */
.btn--md {
  height: var(--control-height);
  min-width: 72px;
  padding: 0 var(--space-4);
  font-size: var(--font-sm);
}

.btn--sm {
  height: 28px;
  min-width: 56px;
  padding: 0 var(--space-3);
  font-size: var(--font-xs);
}

/* ── 变体 ── */
.btn--primary {
  background: var(--color-accent);
  color: var(--color-text-inverse);
  font-weight: 600;
}

.btn--primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

/* 禁用态不留主色：留着会让人以为还能点，只是没反应 */
.btn--primary:disabled {
  background: var(--color-border-strong);
  color: var(--color-text-tertiary);
}

.btn--ghost {
  color: var(--color-text-secondary);
}

.btn--ghost:hover:not(:disabled) {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.btn--outline {
  border: 1px solid var(--color-border-strong);
  color: var(--color-text-secondary);
}

.btn--outline:hover:not(:disabled) {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

/* 二次确认里的「删除」用实心红：那一步就是要人看清自己在点什么 */
.btn--danger {
  background: var(--color-danger);
  color: var(--color-text-inverse);
  font-weight: 600;
}

/* hover 换更深一档的实色，不用 opacity —— 透明度会把底色透出来，红显得发灰 */
.btn--danger:hover:not(:disabled) {
  background: var(--color-danger-hover);
}

/* 页面上的危险入口（如「注销账号」）只描边，hover 才填满，免得一进页面就满屏红 */
.btn--danger-outline {
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
}

.btn--danger-outline:hover:not(:disabled) {
  background: var(--color-danger);
  color: var(--color-text-inverse);
}
</style>
