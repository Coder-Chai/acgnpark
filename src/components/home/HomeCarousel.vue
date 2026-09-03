<script setup lang="ts">
/**
 * 首页轮播。
 * 自动播放 + 圆点指示，鼠标悬停暂停；组件卸载或标签页隐藏时停止计时器。
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'
import type { CarouselSlide } from '@/config/home'

const props = withDefaults(defineProps<{ slides: CarouselSlide[]; interval?: number }>(), {
  interval: 5000,
})

const index = ref(0)
const paused = ref(false)
let timer: ReturnType<typeof setInterval> | undefined

const current = computed(() => props.slides[index.value])

function go(next: number) {
  const count = props.slides.length
  if (count > 0) index.value = (next + count) % count
}

function tick() {
  if (!paused.value && document.visibilityState === 'visible') go(index.value + 1)
}

onMounted(() => {
  if (props.slides.length > 1) timer = setInterval(tick, props.interval)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <section
    class="carousel"
    aria-roledescription="carousel"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
  >
    <!-- 三种形态：站内路由、站外链接（如创作台）、不可点的纯展示 -->
    <component
      :is="current?.to ? 'RouterLink' : current?.href ? 'a' : 'div'"
      v-if="current"
      class="carousel__slide"
      :class="{ 'carousel__slide--image': current.image }"
      :to="current.to ? { name: current.to } : undefined"
      :href="current.href"
      :target="current.href ? '_blank' : undefined"
      :rel="current.href ? 'noopener' : undefined"
    >
      <img v-if="current.image" class="carousel__img" :src="current.image" :alt="current.title" />
      <div class="carousel__body">
        <p class="carousel__title">{{ current.title }}</p>
        <p v-if="current.subtitle" class="carousel__subtitle">{{ current.subtitle }}</p>
      </div>
    </component>

    <template v-if="slides.length > 1">
      <button
        class="carousel__arrow carousel__arrow--prev"
        type="button"
        aria-label="上一张"
        @click="go(index - 1)"
      >
        <AppIcon name="chevronLeft" :size="18" />
      </button>
      <button
        class="carousel__arrow carousel__arrow--next"
        type="button"
        aria-label="下一张"
        @click="go(index + 1)"
      >
        <AppIcon name="chevronRight" :size="18" />
      </button>
    </template>

    <div v-if="slides.length > 1" class="carousel__dots">
      <button
        v-for="(slide, i) in slides"
        :key="slide.id"
        class="carousel__dot"
        :class="{ 'carousel__dot--active': i === index }"
        type="button"
        :aria-label="`第 ${i + 1} 张：${slide.title}`"
        :aria-current="i === index"
        @click="go(i)"
      />
    </div>
  </section>
</template>

<style scoped>
.carousel {
  position: relative;
  overflow: hidden;
  height: 100%;
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
}

.carousel__slide {
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: flex-end;
  padding: var(--space-4);
  background: linear-gradient(135deg, var(--color-brand-soft), var(--color-bg-hover));
}

.carousel__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 有图时文字压在照片上，底部铺一层渐变保证可读性，配色不随主题变 */
.carousel__slide--image::after {
  position: absolute;
  height: 60%;
  background: linear-gradient(to top, var(--color-scrim-strong), transparent);
  content: '';
  inset: auto 0 0;
}

.carousel__slide--image .carousel__title,
.carousel__slide--image .carousel__subtitle {
  color: var(--color-on-scrim);
}

.carousel__slide--image .carousel__subtitle {
  opacity: 0.85;
}

.carousel__slide--image ~ .carousel__dots .carousel__dot {
  background: var(--color-on-scrim-muted);
}

.carousel__slide--image ~ .carousel__dots .carousel__dot--active {
  background: var(--color-on-scrim);
}

.carousel__body {
  position: relative;
}

.carousel__title {
  font-size: var(--font-lg);
  font-weight: 600;
}

.carousel__subtitle {
  margin-top: 2px;
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
}

/* 左右箭头：默认隐藏，悬停或键盘聚焦时浮现 */
.carousel__arrow {
  position: absolute;
  top: 50%;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  translate: 0 -50%;
  border-radius: var(--radius-full);
  background: var(--color-scrim);
  color: var(--color-on-scrim);
  backdrop-filter: blur(4px);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--duration) var(--ease), background var(--duration) var(--ease);
}

.carousel__arrow:hover {
  background: var(--color-scrim-hover);
}

.carousel__arrow--prev {
  left: var(--space-2);
}

.carousel__arrow--next {
  right: var(--space-2);
}

.carousel:hover .carousel__arrow,
.carousel:focus-within .carousel__arrow {
  opacity: 1;
  pointer-events: auto;
}

/* 触屏设备没有悬停，靠圆点和滑动切换即可 */
@media (hover: none) {
  .carousel__arrow {
    display: none;
  }
}

.carousel__dots {
  position: absolute;
  right: var(--space-4);
  bottom: var(--space-4);
  display: flex;
  gap: var(--space-1);
}

.carousel__dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-border-strong);
  transition: width var(--duration) var(--ease), background var(--duration) var(--ease);
}

.carousel__dot--active {
  width: 16px;
  background: var(--color-text);
}
</style>
