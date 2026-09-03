<script setup lang="ts">
/**
 * 一行可复制的文本（次元号、邀请码这类）。
 * 整行都是按钮：只让那个 13px 的图标可点太难瞄。
 */
import AppIcon from '@/components/base/AppIcon.vue'
import { useCopy } from '@/composables/useCopy'

const props = withDefaults(
  defineProps<{
    /** 真正写进剪贴板的内容，可能与显示文本不同（显示带前缀「次元号：」） */
    value: string
    /** 显示文本，默认与 value 相同 */
    label?: string
    /** 复制成功后的提示语 */
    message?: string
  }>(),
  { label: undefined, message: '已复制' },
)

const { copied, copy } = useCopy()
</script>

<template>
  <button
    class="copy"
    type="button"
    :aria-label="copied ? `已复制${props.value}` : `复制${props.value}`"
    @click="copy(props.value, props.message)"
  >
    {{ props.label ?? props.value }}
    <AppIcon
      class="copy__icon"
      :class="{ 'copy__icon--done': copied }"
      :name="copied ? 'check' : 'copy'"
      :size="13"
    />
  </button>
</template>

<style scoped>
/* 字号、字色跟随上下文，让调用方决定这行有多重 */
.copy {
  display: inline-flex;
  gap: var(--space-1);
  align-items: center;
  color: inherit;
  font: inherit;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: color var(--duration) var(--ease);
}

.copy:hover {
  color: var(--color-text-secondary);
}

.copy__icon {
  flex-shrink: 0;
}

/* 站内没有成功色，用品牌色，同样读得出「成了」 */
.copy__icon--done {
  color: var(--color-accent);
}
</style>
