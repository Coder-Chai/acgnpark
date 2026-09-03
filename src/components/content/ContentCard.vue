<script setup lang="ts">
/**
 * 内容卡片。列表通用单元，只负责展示与交互反馈：
 * 点赞态由外部传入（受控），组件自身不持有业务状态，
 * 便于在首页 / 探索 / 收藏等不同数据源下复用。
 */
import AppIcon from '@/components/base/AppIcon.vue'
import { formatCount } from '@/utils/format'
import type { ContentItem } from '@/types/content'

const props = defineProps<{ item: ContentItem; liked?: boolean }>()

const emit = defineEmits<{
  like: [item: ContentItem]
  /** 第二个参数是卡片在视口中的位置，弹窗据此决定从哪个方向浮出 */
  open: [item: ContentItem, origin: DOMRect]
}>()

function onOpen(event: MouseEvent) {
  const el = event.currentTarget
  if (el instanceof HTMLElement) emit('open', props.item, el.getBoundingClientRect())
}

</script>

<template>
  <article class="card" @click="onOpen">
    <div class="card__cover" :style="{ aspectRatio: String(item.ratio) }">
      <img v-if="item.cover" class="card__img" :src="item.cover" :alt="item.title" loading="lazy" />
    </div>

    <p class="card__title">{{ item.title }}</p>

    <div class="card__foot">
      <img v-if="item.avatar" class="card__avatar" :src="item.avatar" :alt="item.author" />
      <span v-else class="card__avatar card__avatar--text" aria-hidden="true">
        {{ item.author.slice(0, 1) }}
      </span>
      <span class="card__author">{{ item.author }}</span>

      <button
        type="button"
        class="card__likes"
        :class="{ 'card__likes--on': props.liked }"
        :aria-pressed="Boolean(props.liked)"
        :aria-label="`点赞，当前 ${item.likes}`"
        @click.stop="emit('like', item)"
      >
        <AppIcon name="heart" :size="14" />
        {{ formatCount(item.likes) }}
      </button>
    </div>
  </article>
</template>

<style scoped>
.card {
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  cursor: pointer;
}

.card__cover {
  position: relative;
  width: 100%;
  background: linear-gradient(135deg, var(--color-brand-soft), var(--color-bg-hover));
}

.card__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* hover 时封面盖一层半透明遮罩，不做位移和阴影 */
.card__cover::after {
  position: absolute;
  background: var(--color-scrim-soft);
  content: '';
  inset: 0;
  opacity: 0;
  transition: opacity var(--duration) var(--ease);
}

.card:hover .card__cover::after {
  opacity: 1;
}

@media (hover: none) {
  .card__cover::after {
    display: none;
  }
}

.card__title {
  display: -webkit-box;
  overflow: hidden;
  padding: var(--space-2) var(--space-3) 0;
  font-size: var(--font-sm);
  font-weight: 500;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

/* 底部一行：左侧头像 + 网名，右侧点赞 */
.card__foot {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3) var(--space-3);
}

.card__avatar {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  object-fit: cover;
}

.card__avatar--text {
  display: grid;
  background: var(--color-brand-soft);
  color: var(--color-brand);
  font-size: var(--font-xs);
  font-weight: 600;
  place-items: center;
}

.card__author {
  overflow: hidden;
  color: var(--color-text-tertiary);
  font-size: var(--font-xs);
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 点赞热区：图标与数字整体可点，比单独点图标好按 */
.card__likes {
  display: flex;
  gap: 3px;
  align-items: center;
  margin-left: auto;
  margin-right: calc(var(--space-2) * -1);
  padding: var(--space-1) var(--space-2);
  flex-shrink: 0;
  border-radius: var(--radius-full);
  color: var(--color-text-tertiary);
  font-size: var(--font-xs);
  line-height: 1;
  cursor: pointer;
  transition: color var(--duration) var(--ease), background var(--duration) var(--ease);
}

.card__likes:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
}

.card__likes--on,
.card__likes--on:hover {
  color: var(--color-like);
}

/* 点亮瞬间做一次回弹，取消点赞不触发（类移除时动画自然失效） */
.card__likes--on :deep(.app-icon) {
  fill: currentColor;
  /* 单段插值 + 回弹缓动，比多关键帧顺滑（多关键帧每段都会重新加减速，显得一顿一顿） */
  animation: like-pop 460ms cubic-bezier(0.18, 1.5, 0.4, 1);
  will-change: scale;
}

@keyframes like-pop {
  from {
    scale: 0.6;
  }
  to {
    scale: 1;
  }
}

/* 按下时先轻轻缩一下，松手接上回弹 */
.card__likes:active :deep(.app-icon) {
  scale: 0.85;
  transition: scale 90ms var(--ease);
}

@media (prefers-reduced-motion: reduce) {
  .card__likes--on :deep(.app-icon) {
    animation: none;
  }
}
</style>
