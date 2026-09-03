<script setup lang="ts">
/**
 * 侧边栏底部工具条：主题切换 / 移动端入口 / 更多。
 * 收起态下三个按钮竖排，浮层依旧从按钮右上方展开。
 */
import { computed } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'
import AppPopover from '@/components/base/AppPopover.vue'
import { useThemeStore } from '@/stores/theme'
import {
  ALGORITHM_RECORD,
  COMPANY_ADDRESS,
  COMPANY_NAME,
  ICP_QUERY_URL,
  ICP_RECORD,
  MOBILE_QRCODE_URL,
  MOBILE_SITE_HINT,
  MORE_LINK_GROUPS,
  SOCIAL_LINKS,
} from '@/config/site'

defineProps<{ collapsed?: boolean }>()

const theme = useThemeStore()

/** 三个按钮只有图标，文案同时用于 title（悬浮提示）与 aria-label（读屏） */
const themeLabel = computed(() =>
  theme.mode === 'dark' ? '切换到浅色模式' : '切换到深色模式',
)
</script>

<template>
  <div class="foot" :class="{ 'foot--collapsed': collapsed }">
    <button
      class="foot__btn"
      type="button"
      :title="themeLabel"
      :aria-label="themeLabel"
      @click="theme.toggle()"
    >
      <AppIcon :name="theme.mode === 'dark' ? 'sun' : 'moon'" />
    </button>

    <AppPopover>
      <template #trigger="{ toggle }">
        <button class="foot__btn" type="button" title="移动端" aria-label="移动端" @click="toggle">
          <AppIcon name="smartphone" />
        </button>
      </template>

      <div class="qr">
        <!--
          有码时才铺白底：黑白二维码在深色背景上边缘会糊，识别率下降，所以白框是必须的。
          没码时只是占位，跟着主题走，免得深色模式下凭空一块白。
        -->
        <div v-if="MOBILE_QRCODE_URL" class="qr__frame">
          <img class="qr__img" :src="MOBILE_QRCODE_URL" alt="移动端二维码" />
        </div>
        <div v-else class="qr__img qr__img--empty">二维码</div>
        <p class="qr__hint">{{ MOBILE_SITE_HINT }}</p>
      </div>
    </AppPopover>

    <AppPopover>
      <template #trigger="{ toggle }">
        <button class="foot__btn" type="button" title="更多" aria-label="更多" @click="toggle">
          <AppIcon name="info" />
        </button>
      </template>

      <div class="menu">
        <ul v-for="(group, index) in MORE_LINK_GROUPS" :key="index" class="menu__group">
          <!-- 信息页一律新窗口打开，不打断当前浏览 -->
          <li v-for="link in group" :key="link.label">
            <RouterLink
              v-if="link.to"
              class="menu__item"
              :to="{ name: link.to }"
              target="_blank"
              rel="noopener"
            >
              {{ link.label }}
              <AppIcon class="menu__external" name="arrowUpRight" :size="16" />
            </RouterLink>
            <a v-else class="menu__item" :href="link.href" target="_blank" rel="noopener">
              {{ link.label }}
              <AppIcon class="menu__external" name="arrowUpRight" :size="16" />
            </a>
          </li>
        </ul>

        <div class="social">
          <component
            :is="social.href ? 'a' : 'span'"
            v-for="social in SOCIAL_LINKS"
            :key="social.label"
            class="social__item"
            :class="{ 'social__item--muted': !social.href }"
            :href="social.href"
            :target="social.href ? '_blank' : undefined"
            :rel="social.href ? 'noopener' : undefined"
            :title="social.label"
            :aria-label="social.label"
          >
            <img
              class="social__logo"
              :class="{ 'social__logo--invert': social.invertOnDark }"
              :src="social.icon"
              :alt="social.label"
            />
          </component>
        </div>

        <div class="menu__legal">
          <p v-if="COMPANY_NAME">{{ COMPANY_NAME }}</p>
          <p v-if="COMPANY_ADDRESS">联系地址：{{ COMPANY_ADDRESS }}</p>
          <p v-if="ICP_RECORD">
            <a :href="ICP_QUERY_URL" target="_blank" rel="noopener">{{ ICP_RECORD }}</a>
          </p>
          <p v-if="ALGORITHM_RECORD">{{ ALGORITHM_RECORD }}</p>
        </div>
      </div>
    </AppPopover>
  </div>
</template>

<style scoped>
.foot {
  display: flex;
  align-items: center;
  /* 等距分布，且两端各留一份间距，整体比贴边更收拢 */
  justify-content: space-evenly;
  /* 下边距大于上边距，避免图标贴着侧边栏底沿 */
  padding: var(--space-2) var(--space-4) var(--space-5);
  flex-shrink: 0;
}

.foot--collapsed {
  flex-direction: column;
  gap: var(--space-1);
  padding-inline: var(--space-2);
}

.foot__btn {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  /* 与导航图标同色，底部工具条不弱化 */
  color: var(--color-nav-icon);
  transition: background var(--duration) var(--ease), color var(--duration) var(--ease);
}

.foot__btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

/* ── 二维码浮层 ── */
/* 定宽 168：正好让提示语断成「微信扫码，」「随时随地逛次元公园」两行，不出现孤字 */
.qr {
  width: 168px;
  text-align: center;
}

.qr__frame {
  display: grid;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  background: var(--color-qr-bg);
  place-items: center;
}

.qr__img {
  display: block;
  width: 136px;
  height: 136px;
}

/* 占位块：走主题变量，深浅色下都是低对比的虚线框 */
.qr__img--empty {
  display: grid;
  width: 152px;
  height: 152px;
  margin: 0 auto;
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-md);
  color: var(--color-text-tertiary);
  font-size: var(--font-sm);
  place-items: center;
}

.qr__hint {
  margin-top: var(--space-3);
  color: var(--color-text-secondary);
  font-size: var(--font-xs);
  line-height: 1.6;
}

/* ── 更多菜单 ── */
.menu {
  min-width: 208px;
}

/* 组间分隔线；首组之上不画线 */
.menu__group + .menu__group,
.menu__legal {
  margin-top: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border);
}

.menu__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
  white-space: nowrap;
  transition: background var(--duration) var(--ease), color var(--duration) var(--ease);
}

.menu__item:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

/* 新窗口标记：常态弱化，hover 时跟随文字提亮 */
.menu__external {
  margin-left: auto;
  color: var(--color-text-tertiary);
  transition: color var(--duration) var(--ease);
}

.menu__item:hover .menu__external {
  color: inherit;
}

/* 社交入口，紧跟在「联系客服」下方 */
/* 三个 logo 在菜单宽度内等距分布，与侧边栏底部工具条同一套节奏 */
.social {
  display: flex;
  justify-content: space-evenly;
  padding: var(--space-1) 6px;
}

.social__item {
  display: grid;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  place-items: center;
  transition: background var(--duration) var(--ease), color var(--duration) var(--ease);
}

.social__item:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.social__item--muted {
  cursor: default;
}

.social__logo {
  display: block;
  width: 22px;
  height: 22px;
}

[data-theme='dark'] .social__logo--invert {
  filter: invert(1);
}

.menu__legal {
  color: var(--color-text-tertiary);
  font-size: var(--font-xs);
}

/* 行距与上方链接项保持同一节奏 */
.menu__legal p {
  padding: var(--space-2) var(--space-3);
}

.menu__legal a {
  color: inherit;
  transition: color var(--duration) var(--ease);
}

.menu__legal a:hover {
  color: var(--color-text-secondary);
}
</style>
