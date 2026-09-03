<script setup lang="ts">
/**
 * 404 页。图标 + 提示 + 倒计时自动回首页 + 手动按钮。
 * 倒计时归零后走 replace，避免用户按浏览器返回又弹回这个不存在的地址。
 */
import { onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import notFoundImage from '@/assets/404.svg'

/** 自动返回首页的等待秒数 */
const REDIRECT_SECONDS = 3

const router = useRouter()
const seconds = ref(REDIRECT_SECONDS)

const timer = setInterval(() => {
  seconds.value -= 1
  if (seconds.value > 0) return
  clearInterval(timer)
  goHome()
}, 1000)

function goHome() {
  clearInterval(timer)
  router.replace({ name: 'home' })
}

onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="notfound">
    <img class="notfound__icon" :src="notFoundImage" alt="" />

    <h1 class="notfound__title">你访问的页面不见了</h1>
    <p class="notfound__hint">{{ seconds }} 秒后将自动返回首页</p>

    <button class="notfound__btn" type="button" @click="goHome">返回首页</button>
  </div>
</template>

<style scoped>
.notfound {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  /* 减掉顶栏高度，在内容区里真正居中 */
  min-height: calc(100dvh - var(--header-height));
  padding: var(--space-6);
  text-align: center;
}

/* 插画本身 280×188，按宽度等比缩放 */
.notfound__icon {
  width: 200px;
  height: auto;
}

.notfound__title {
  margin-top: var(--space-5);
  font-size: var(--font-lg);
  font-weight: 600;
}

.notfound__hint {
  margin-top: var(--space-2);
  color: var(--color-text-tertiary);
  font-size: var(--font-sm);
}

.notfound__btn {
  height: 38px;
  margin-top: var(--space-5);
  padding: 0 var(--space-6);
  border-radius: var(--radius-full);
  background: var(--color-accent);
  color: var(--color-text-inverse);
  font-size: var(--font-sm);
  font-weight: 600;
  transition: background var(--duration) var(--ease);
}

.notfound__btn:hover {
  background: var(--color-accent-hover);
}
</style>
