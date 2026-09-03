<script setup lang="ts">
/**
 * 导航列表（纯展示组件）。
 * 侧边栏与移动端抽屉共用；不感知自己被放在哪里，只按传入的分组渲染。
 */
import AppIcon from '@/components/base/AppIcon.vue'
import type { NavGroup } from '@/config/navigation'

withDefaults(
  defineProps<{
    groups: NavGroup[]
    /** 收起态：仅显示图标，标题隐藏 */
    collapsed?: boolean
  }>(),
  { collapsed: false },
)

const emit = defineEmits<{ navigate: [] }>()
</script>

<template>
  <nav class="nav" :class="{ 'nav--collapsed': collapsed }">
    <div v-for="(group, index) in groups" :key="group.title ?? index" class="nav__group">
      <p v-if="group.title && !collapsed" class="nav__group-title">{{ group.title }}</p>
      <ul>
        <li v-for="item in group.items" :key="String(item.name)">
          <!-- 站外入口（如创作台）：新窗口打开，末尾用箭头标记 -->
          <a
            v-if="item.href"
            class="nav__link"
            :class="{ 'nav__link--sub': group.level === 2 }"
            :href="item.href"
            target="_blank"
            rel="noopener"
            :title="collapsed ? item.label : undefined"
            @click="emit('navigate')"
          >
            <AppIcon :name="item.icon" />
            <span class="nav__label">{{ item.label }}</span>
            <AppIcon class="nav__external" name="arrowUpRight" :size="14" />
          </a>

          <RouterLink
            v-else
            class="nav__link"
            :class="{ 'nav__link--sub': group.level === 2 }"
            :to="{ name: item.name }"
            active-class="nav__link--active"
            :title="collapsed ? item.label : undefined"
            @click="emit('navigate')"
          >
            <AppIcon :name="item.icon" />
            <span class="nav__label">{{ item.label }}</span>
          </RouterLink>
        </li>
      </ul>
    </div>
  </nav>
</template>

<style scoped>
.nav {
  /* 分组间距，想调松紧改这一个值 */
  --group-gap: var(--space-2);

  display: flex;
  flex-direction: column;
  gap: var(--group-gap);
  /* 左右 16 内边距：208 的侧边栏里选中项正好 176 宽 */
  padding: var(--space-3) var(--space-4) var(--space-6);
}

.nav__group-title {
  padding: 0 var(--space-3) var(--space-2);
  color: var(--color-text-tertiary);
  font-size: var(--font-xs);
  font-weight: 600;
  letter-spacing: 0.06em;
}

.nav__group ul {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav__link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 36px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-nav-text);
  font-size: var(--font-md);
  font-weight: 500;
  transition: background var(--duration) var(--ease), color var(--duration) var(--ease);
}

/* 图标与文字取不同深度，需要跨组件边界单独指定 */
.nav__link :deep(.app-icon) {
  color: var(--color-nav-icon);
}

.nav__link:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

/* 二级菜单字号收一档，与主入口拉开层级 */
.nav__link--sub {
  font-size: var(--font-sm);
}

.nav__link--active {
  background: var(--color-bg-hover);
  color: var(--color-text);
  font-weight: 600;
}

.nav__label {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 外链箭头贴右缘，比正文浅一档，不跟图标抢注意力。
   选择器要盖住上面的 .nav__link :deep(.app-icon)，故连写两级 */
.nav__link .nav__external {
  margin-left: auto;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

/* 收起态：图标居中，文字不占位 */
.nav--collapsed {
  padding-inline: var(--space-2);
}

.nav--collapsed .nav__link {
  justify-content: center;
  padding: 0;
}

.nav--collapsed .nav__label,
.nav--collapsed .nav__external {
  display: none;
}
</style>
