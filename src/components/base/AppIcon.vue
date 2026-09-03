<script setup lang="ts">
/**
 * 图标组件。
 * 以内联 path 的方式收敛所有图标，避免引入图标库依赖；
 * 尺寸/颜色继承父级（currentColor + em），调用方无需关心内部实现。
 */
import { computed } from 'vue'
import { FILLED_ICONS, ICON_PATHS, type IconName } from './icons'

const props = withDefaults(defineProps<{ name: IconName; size?: number | string }>(), {
  size: 20,
})

const path = computed(() => ICON_PATHS[props.name])
const filled = computed(() => FILLED_ICONS.has(props.name))
const pixelSize = computed(() =>
  typeof props.size === 'number' ? `${props.size}px` : props.size,
)
</script>

<template>
  <svg
    class="app-icon"
    viewBox="0 0 24 24"
    :fill="filled ? 'currentColor' : 'none'"
    :stroke="filled ? 'none' : 'currentColor'"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="path" />
  </svg>
</template>

<style scoped>
.app-icon {
  /* block 消除 inline 基线留白，图标与相邻文字才能真正居中对齐 */
  display: block;
  width: v-bind(pixelSize);
  height: v-bind(pixelSize);
  flex-shrink: 0;
}
</style>
