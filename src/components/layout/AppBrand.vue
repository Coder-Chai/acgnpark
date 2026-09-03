<script setup lang="ts">
/**
 * 品牌标识。
 * 展开态用横版字标；收起态宽度不足，退回字母标记。
 * 待补一版方形 mark 后，把 compact 分支换成该图即可。
 */
import logoUrl from '@/assets/logo.png'

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
</script>

<template>
  <RouterLink class="brand" :to="{ name: 'home' }" aria-label="ACGNPark 首页">
    <span v-if="compact" class="brand__mark">A</span>
    <img v-else class="brand__logo" :src="logoUrl" alt="ACGNPark 次元公园" width="176" height="40" />
  </RouterLink>
</template>

<style scoped>
.brand {
  display: flex;
  align-items: center;
  min-width: 0;
}

.brand__logo {
  width: auto;
  /* 原图 176×40，按高等比缩放到 140×32，给折叠按钮留出余量 */
  height: 32px;
}

.brand__mark {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background: var(--color-brand);
  color: var(--color-text-inverse);
  font-size: var(--font-xl);
  font-weight: 700;
}

/* 字标是黑色像素图，暗色背景下反相为白色 */
[data-theme='dark'] .brand__logo {
  filter: invert(1);
}

@media (max-width: 767px) {
  .brand__logo {
    height: 28px;
  }
}
</style>
