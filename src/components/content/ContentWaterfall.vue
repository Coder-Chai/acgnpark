<script setup lang="ts">
/**
 * 瀑布流容器。只负责排版与列表渲染，不关心数据从哪来、点赞如何落库。
 * 想换卡片样式时改 ContentCard，想换排布时只改这里。
 */
import ContentCard from './ContentCard.vue'
import type { ContentItem } from '@/types/content'

withDefaults(
  defineProps<{
    items: ContentItem[]
    /** 已点赞 id 集合，受控传入 */
    likedIds?: Set<string>
  }>(),
  { likedIds: () => new Set<string>() },
)

defineEmits<{
  like: [item: ContentItem]
  open: [item: ContentItem, origin: DOMRect]
}>()
</script>

<template>
  <ul class="waterfall">
    <li v-for="item in items" :key="item.id" class="waterfall__cell">
      <ContentCard
        :item="item"
        :liked="likedIds.has(item.id)"
        @like="$emit('like', $event)"
        @open="(item, origin) => $emit('open', item, origin)"
      />
    </li>
  </ul>
</template>

<style scoped>
/*
 * 用 CSS 多列 + break-inside 实现，卡片按自身封面比例自然错落，
 * 不需要测量高度的 JS。代价是排列顺序为「按列从上到下」，
 * 信息流场景不敏感；若将来要求严格按行顺序再换 JS 分列。
 */
.waterfall {
  /* 列宽 220 起，最多 5 列 */
  columns: 220px 5;
  column-gap: var(--space-3);
}

.waterfall__cell {
  margin-bottom: var(--space-3);
  break-inside: avoid;
}

@media (max-width: 767px) {
  /* 移动端固定两列 */
  .waterfall {
    column-width: auto;
    column-count: 2;
    column-gap: var(--space-2);
  }

  .waterfall__cell {
    margin-bottom: var(--space-2);
  }
}
</style>
