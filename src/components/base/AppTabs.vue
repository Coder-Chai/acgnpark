<script setup lang="ts">
/**
 * 水平标签栏（受控组件）。
 * 只管选中态与键盘操作，内容面板由调用方渲染 —— 因此列表页、详情页都能复用。
 * 遵循 WAI-ARIA tabs 模式：左右方向键切换，Home/End 跳首尾。
 */
import { ref } from 'vue'

export interface TabItem {
  key: string
  label: string
  /** 右上角计数，如未读数、条目数 */
  badge?: number | string
}

const props = defineProps<{ tabs: TabItem[]; modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [key: string] }>()

const buttons = ref<HTMLButtonElement[]>([])

function select(key: string) {
  if (key !== props.modelValue) emit('update:modelValue', key)
}

function onKeydown(event: KeyboardEvent, index: number) {
  const last = props.tabs.length - 1
  const target = {
    ArrowLeft: index - 1,
    ArrowRight: index + 1,
    Home: 0,
    End: last,
  }[event.key]

  if (target === undefined) return
  event.preventDefault()

  const next = Math.min(Math.max(target, 0), last)
  const tab = props.tabs[next]
  if (!tab) return
  select(tab.key)
  buttons.value[next]?.focus()
}
</script>

<template>
  <div class="tabs" role="tablist">
    <button
      v-for="(tab, index) in tabs"
      :key="tab.key"
      ref="buttons"
      class="tabs__item"
      :class="{ 'tabs__item--active': tab.key === modelValue }"
      type="button"
      role="tab"
      :aria-selected="tab.key === modelValue"
      :tabindex="tab.key === modelValue ? 0 : -1"
      @click="select(tab.key)"
      @keydown="onKeydown($event, index)"
    >
      {{ tab.label }}
      <span v-if="tab.badge !== undefined" class="tabs__badge">{{ tab.badge }}</span>
    </button>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: var(--space-5);
  overflow-x: auto;
  /* 标签多时横向滚动，隐藏滚动条避免占高 */
  scrollbar-width: none;
}

.tabs::-webkit-scrollbar {
  display: none;
}

/* 纯文字标签：靠字色与字重区分，不做按钮化的底色和描边 */
.tabs__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-1);
  height: 32px;
  color: var(--color-text-tertiary);
  font-size: var(--font-lg);
  font-weight: 500;
  white-space: nowrap;
  transition: color var(--duration) var(--ease);
}

.tabs__item:hover {
  color: var(--color-text-secondary);
}

.tabs__item--active {
  color: var(--color-text);
  font-weight: 600;
}

/* 选中项下方的短横线指示器 */
.tabs__item--active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 16px;
  height: 2px;
  translate: -50% 0;
  border-radius: var(--radius-full);
  background: var(--color-text);
}

.tabs__badge {
  color: var(--color-text-tertiary);
  font-size: var(--font-xs);
  font-weight: 400;
}
</style>
