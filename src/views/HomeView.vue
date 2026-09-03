<script setup lang="ts">
/** 首页：顶部横排 + 分区标签 + 对应内容。 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HomeShowcase from '@/components/home/HomeShowcase.vue'
import HomeFeed from '@/components/home/HomeFeed.vue'
import AppTabs from '@/components/base/AppTabs.vue'
import { DEFAULT_HOME_TAB, HOME_TABS, isHomeTabKey, type HomeTabKey } from '@/config/home'

const route = useRoute()
const router = useRouter()

/**
 * 选中的分区存在地址栏 query 里而不是组件内部：
 * 刷新、前进后退、分享链接都能回到同一个分区。
 */
const activeTab = computed<HomeTabKey>({
  get: () => (isHomeTabKey(route.query.tab) ? route.query.tab : DEFAULT_HOME_TAB),
  set: (key) => {
    const tab = key === DEFAULT_HOME_TAB ? undefined : key
    router.replace({ query: { ...route.query, tab } })
  },
})
</script>

<template>
  <div class="home">
    <HomeShowcase />

    <AppTabs v-model="activeTab" class="home__tabs" :tabs="[...HOME_TABS]" />

    <HomeFeed :tab-key="activeTab" />
  </div>
</template>

<style scoped>
.home {
  /* 上边距与侧边栏导航区一致（同为 --space-3），首行卡片与「首页」项顶边齐平 */
  padding: var(--space-3) var(--content-padding-x) var(--space-8);
}

.home__tabs {
  margin: var(--space-5) 0 var(--space-4);
}
</style>
