<script setup lang="ts">
/**
 * 首页分区内容。职责只有「按 tab 取数 + 加载态」，
 * 瀑布流、详情弹窗、点赞这一整套装配都在 ContentCollection 里，
 * 与个人页等其他列表页共用。接入接口后把 createMockFeed 换成请求即可。
 */
import { onBeforeUnmount, ref, watch } from 'vue'
import ContentCollection from '@/components/content/ContentCollection.vue'
import { createMockFeed } from '@/config/content'
import type { HomeTabKey } from '@/config/home'
import type { ContentItem } from '@/types/content'

const props = defineProps<{ tabKey: HomeTabKey }>()

/** 模拟网络耗时，接真实接口后连同 setTimeout 一起删掉 */
const MOCK_LATENCY = 600

const items = ref<ContentItem[]>([])
const loading = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

watch(
  () => props.tabKey,
  (key) => {
    // 连续快速切换时丢弃上一次的等待，避免旧结果覆盖新分区
    clearTimeout(timer)
    loading.value = true
    timer = setTimeout(() => {
      items.value = createMockFeed(key)
      loading.value = false
    }, MOCK_LATENCY)
  },
  { immediate: true },
)

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <ContentCollection :items="items" :loading="loading" empty-text="这个分区还没有内容" />
</template>
