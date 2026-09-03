<script setup lang="ts">
/**
 * 顶栏账号入口。未登录展示「登录/注册」按钮，登录后展示头像。
 * 头像点开是账号菜单：开合与关闭时机交给 AppPopover，菜单项来自
 * config/navigation 的 USER_MENU_ITEMS，这里不持有任何账号数据。
 */
import { storeToRefs } from 'pinia'
import AppCopyText from '@/components/base/AppCopyText.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import AppPopover from '@/components/base/AppPopover.vue'
import { USER_MENU_ITEMS } from '@/config/navigation'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const { user, isLoggedIn } = storeToRefs(auth)
</script>

<template>
  <button v-if="!isLoggedIn" class="entry__login" type="button" @click="auth.openLoginDialog()">
    <AppIcon name="user" :size="16" />
    登录 / 注册
  </button>

  <!-- 头像贴着顶栏右缘，菜单必须右对齐，否则会伸出视口 -->
  <AppPopover v-else placement="bottom" align="end">
    <template #trigger="{ open, toggle }">
      <button
        class="entry__avatar"
        type="button"
        :aria-label="user?.name"
        aria-haspopup="menu"
        :aria-expanded="open"
        @click="toggle"
      >
        <img v-if="user?.avatar" class="entry__img" :src="user.avatar" :alt="user.name" />
        <template v-else>{{ user?.name.slice(0, 1) }}</template>
      </button>
    </template>

    <template #default="{ close }">
      <div class="menu" role="menu">
        <!-- 顶部先确认「你是谁」：多账号切换时不至于在错的号上做操作 -->
        <div class="menu__me">
          <p class="menu__name">{{ user?.name }}</p>
          <!-- 次元号是要报给客服、写进公众号留言的，就地能抄走 -->
          <AppCopyText
            v-if="user"
            class="menu__uid"
            :value="user.uid"
            :label="`次元号：${user.uid}`"
            message="已复制次元号"
          />
        </div>

        <RouterLink
          v-for="item in USER_MENU_ITEMS"
          :key="String(item.name)"
          class="menu__item"
          role="menuitem"
          :to="{ name: item.name }"
        >
          <AppIcon class="menu__icon" :name="item.icon" :size="16" />
          {{ item.label }}
        </RouterLink>

        <!-- 退出是动作不是页面，用分隔线与上面的入口分开 -->
        <div class="menu__sep" role="separator"></div>
        <button
          class="menu__item menu__item--quit"
          type="button"
          role="menuitem"
          @click="close(); auth.logout()"
        >
          <AppIcon class="menu__icon" name="logout" :size="16" />
          退出登录
        </button>
      </div>
    </template>
  </AppPopover>
</template>

<style scoped>
.entry__login {
  display: flex;
  gap: var(--space-1);
  align-items: center;
  height: var(--control-height);
  flex-shrink: 0;
  padding: 0 var(--space-4);
  border-radius: var(--radius-full);
  background: var(--color-accent);
  color: var(--color-text-inverse);
  font-size: var(--font-sm);
  font-weight: 500;
  white-space: nowrap;
  transition: background var(--duration) var(--ease);
}

.entry__login:hover {
  background: var(--color-accent-hover);
}

/*
 * 头像用 box-shadow 画外圈而不是 border：border 会占掉内容盒尺寸，
 * 头像图跟着缩一圈，展开/收起时图片大小会抖。
 */
.entry__avatar {
  display: grid;
  overflow: hidden;
  width: var(--control-height);
  height: var(--control-height);
  flex-shrink: 0;
  border-radius: var(--radius-full);
  background: var(--color-brand);
  color: var(--color-text-inverse);
  font-size: var(--font-sm);
  font-weight: 600;
  cursor: pointer;
  place-items: center;
  transition: box-shadow var(--duration) var(--ease);
}

.entry__avatar:hover,
.entry__avatar[aria-expanded='true'] {
  box-shadow: 0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-accent);
}

.entry__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 面板的边框、圆角、阴影归 AppPopover，这里只管内容 */
.menu {
  min-width: 168px;
}

/*
 * 名字这行不做成菜单项：它不可点，给内边距对齐下面的图标列即可。
 * 分隔线用负外边距拉满整宽，与面板内边距无关。
 */
.menu__me {
  margin: 0 calc(var(--space-2) * -1) var(--space-2);
  padding: var(--space-1) var(--space-4) var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.menu__name {
  color: var(--color-text);
  font-size: var(--font-sm);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 复制交互归 AppCopyText，这里只定位置与字号 */
.menu__uid {
  margin-top: var(--space-1);
  color: var(--color-text-tertiary);
  font-size: var(--font-xs);
}

.menu__item {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  width: 100%;
  height: 36px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: var(--font-sm);
  white-space: nowrap;
  cursor: pointer;
  transition: background var(--duration) var(--ease), color var(--duration) var(--ease);
}

.menu__item:hover {
  background: var(--color-bg-hover);
}

/* 图标常态压一档灰，hover 时跟文字一起提亮，整行才像一个整体 */
.menu__icon {
  flex-shrink: 0;
  color: var(--color-text-tertiary);
  transition: color var(--duration) var(--ease);
}

.menu__item:hover .menu__icon {
  color: var(--color-text);
}

/* 退出与上面的页面入口不是一类：拿一条分隔线隔开，并压一档字色 */
.menu__sep {
  margin: var(--space-2) calc(var(--space-2) * -1);
  border-top: 1px solid var(--color-border);
}

.menu__item--quit {
  color: var(--color-text-secondary);
}

.menu__item--quit:hover {
  color: var(--color-text);
}
</style>
