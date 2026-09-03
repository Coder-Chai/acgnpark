<script setup lang="ts">
/**
 * 首页顶部横排：左侧轮播 + 右侧三张等宽入口卡。
 * 尺寸由下方两个局部变量控制，改这两个值即可整体缩放。
 */
import HomeCarousel from './HomeCarousel.vue'
import { CAROUSEL_SLIDES, SHOWCASE_CARDS } from '@/config/home'
</script>

<template>
  <section class="showcase">
    <HomeCarousel class="showcase__carousel" :slides="CAROUSEL_SLIDES" />

    <component
      :is="card.to ? 'RouterLink' : 'div'"
      v-for="card in SHOWCASE_CARDS"
      :key="card.id"
      class="showcase__card"
      :to="card.to ? { name: card.to } : undefined"
    >
      <img v-if="card.image" class="showcase__img" :src="card.image" :alt="card.title" />
      <div class="showcase__body">
        <p class="showcase__title">{{ card.title }}</p>
        <p v-if="card.subtitle" class="showcase__subtitle">{{ card.subtitle }}</p>
      </div>
    </component>
  </section>
</template>

<style scoped>
.showcase {
  /* 行高固定，宽度按比例分配：轮播 1.6 份，三张卡各 1 份 */
  --card-height: 145px;
  --carousel-span: 2.4fr;
  --card-gap: 10px;

  display: grid;
  grid-template-columns: var(--carousel-span) repeat(3, 1fr);
  gap: var(--card-gap);
  height: var(--card-height);
}

.showcase__carousel {
  min-width: 0;
}

.showcase__card {
  position: relative;
  display: flex;
  overflow: hidden;
  min-width: 0;
  flex-direction: column;
  justify-content: flex-end;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
}

.showcase__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.showcase__body {
  position: relative;
}

.showcase__title {
  font-weight: 600;
}

.showcase__subtitle {
  margin-top: 2px;
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
}

/* 窄屏放不下四列，整行改为横向滑动 */
/* H5 横向空间有限，只保留轮播，三张入口卡不展示 */
@media (max-width: 767px) {
  .showcase {
    display: block;
  }

  .showcase__card {
    display: none;
  }
}
</style>
