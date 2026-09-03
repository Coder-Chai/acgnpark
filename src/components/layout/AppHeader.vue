<script setup lang="ts">
/**
 * 顶部栏。桌面端与移动端共用，差异仅由 props 控制：
 * 移动端多一个菜单按钮与品牌标识（桌面端这两者在侧边栏里）。
 */
import AppBrand from './AppBrand.vue'
import AppUserEntry from './AppUserEntry.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import vipIcon from '@/assets/VIP.svg'

withDefaults(defineProps<{ showMenu?: boolean; showBrand?: boolean }>(), {
  showMenu: false,
  showBrand: false,
})

const emit = defineEmits<{ 'menu-click': [] }>()
</script>

<template>
  <header class="header">
    <button
      v-if="showMenu"
      class="header__icon-btn"
      type="button"
      aria-label="打开导航菜单"
      @click="emit('menu-click')"
    >
      <AppIcon name="menu" />
    </button>

    <AppBrand v-if="showBrand" />

    <!--
      搜索功能未实现，先整块下线 —— 摆一个点了没反应的输入框，
      比没有搜索更像出了故障。样式留在下面，接了搜索接口直接放出来。
    <div class="header__search">
      <input type="search" placeholder="搜索作品、模型、作者" aria-label="搜索" />
      图标改放右侧并做成按钮：搜索栏拉长后，左侧图标离输入焦点太远，右侧更好点
      <button class="header__search-btn" type="button" title="搜索" aria-label="搜索">
        <AppIcon name="search" :size="18" />
      </button>
    </div>
    -->

    <div class="header__actions">
      <slot name="actions">
        <!-- 会员入口独立于账号态：未登录点进去也能看权益介绍 -->
        <RouterLink class="header__member" :to="{ name: 'membership' }">
          <img class="header__member-icon" :src="vipIcon" alt="" />
          会员中心
        </RouterLink>
        <AppUserEntry />
      </slot>
    </div>
  </header>
</template>

<style scoped>
.header {
  /* 悬停在滚动内容之上，滚动条因此从顶部贯穿 */
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: var(--header-height);
  padding: 0 var(--content-padding-x);
  background: var(--color-bg);
  flex-shrink: 0;
}

/* ── 搜索框（模板里暂时注释掉，等接了搜索再放出来） ── */
.header__search {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  max-width: 700px;
  height: 44px;
  /* 右内边距小一档，让图标按钮的点击热区贴近圆角边缘又不出血 */
  padding: 0 var(--space-2) 0 var(--space-4);
  /* 常态用透明边框占位，聚焦时只换颜色，高度不跳 */
  border: 1px solid transparent;
  border-radius: var(--radius-full);
  background: var(--color-bg-sunken);
  color: var(--color-text-tertiary);
  transition: border-color var(--duration) var(--ease);
}

/* 聚焦提示做得很轻：一圈中性描边，不用品牌色抢注意力 */
.header__search:focus-within {
  border-color: var(--color-border-strong);
}

.header__search input {
  width: 100%;
  border: none;
  background: none;
  color: var(--color-text);
  font: inherit;
  outline: none;
}

.header__search input::placeholder {
  color: var(--color-text-tertiary);
}

.header__search-btn {
  display: grid;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  color: var(--color-text-tertiary);
  place-items: center;
  transition: background var(--duration) var(--ease), color var(--duration) var(--ease);
}

.header__search-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
}

/*
 * 会员入口：文字按钮而非实心块。
 * 右边的「登录 / 注册」是页面主行动，这里只用彩色 VIP 图标点一下身份感，
 * 两个都做成实心按钮会互相抢焦点。
 */
.header__member {
  display: flex;
  gap: var(--space-1);
  align-items: center;
  height: var(--control-height);
  flex-shrink: 0;
  padding: 0 var(--space-4);
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
  font-weight: 500;
  white-space: nowrap;
  transition: background var(--duration) var(--ease), color var(--duration) var(--ease);
}

/* 官方彩色 logo，不跟随文字色 */
.header__member-icon {
  display: block;
  width: 16px;
  height: 16px;
}

.header__member:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.header__icon-btn {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  transition: background var(--duration) var(--ease), color var(--duration) var(--ease);
}

.header__icon-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

/* 移动端顶栏只留菜单、品牌和账号入口，搜索与会员入口另行安排 */
@media (max-width: 767px) {
  .header__search,
  .header__member {
    display: none;
  }
}
</style>
