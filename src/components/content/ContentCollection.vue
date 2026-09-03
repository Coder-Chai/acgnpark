<script setup lang="ts">
/**
 * 内容集合。把「瀑布流 + 详情弹窗 + 点赞 + 加载态 + 空态」这一整套装配好，
 * 数据从外部传入 —— 首页分区、个人页的帖子/收藏/赞过都是同一套装配，
 * 只有取数逻辑不同，所以取数留在各自页面，装配收在这里，避免每个列表页各抄一遍。
 */
import { computed, ref } from 'vue'
import AppSpinner from '@/components/base/AppSpinner.vue'
import ContentWaterfall from '@/components/content/ContentWaterfall.vue'
import ContentDetailDialog from '@/components/content/ContentDetailDialog.vue'
import { useLikes } from '@/composables/useLikes'
import { createMockDetail } from '@/config/content'
import type { ContentDetail, ContentItem } from '@/types/content'

const props = withDefaults(
  defineProps<{
    items: ContentItem[]
    loading?: boolean
    /** 列表为空时的一句话，为空则不展示空态 */
    emptyText?: string
  }>(),
  { loading: false, emptyText: '' },
)

const { likedIds, toggle } = useLikes()

/**
 * 打开的列表项。null 即关闭 —— 弹窗的开合完全由这一个值决定，
 * 不再额外维护 visible，避免两个状态走偏。
 * 存的是列表里的那个对象本身，不是副本：点赞会就地改它的 likes，
 * 卡片与弹窗读同一份数据，数字才不会分叉。
 */
const current = ref<ContentItem | null>(null)
/** 触发卡片的位置，交给弹窗决定入场方向 */
const origin = ref<DOMRect | null>(null)

/**
 * 详情。createMockDetail 是纯函数且结果只取决于 id，
 * 放在 computed 里可以让 likes 跟着列表项的变化重算。
 * TODO: 接口就绪后改为按 id 请求详情，createMockDetail 一并删除。
 */
const detail = computed<ContentDetail | null>(() =>
  current.value ? createMockDetail(current.value) : null,
)
/** 弹窗里的点赞态与卡片同源，取自同一个 likedIds */
const currentLiked = computed(() => current.value !== null && likedIds.value.has(current.value.id))

/** 加载中不报空 —— 否则每次切换都会先闪一下「还没有内容」 */
const isEmpty = computed(() => !props.loading && props.items.length === 0)

function openDetail(item: ContentItem, rect: DOMRect) {
  origin.value = rect
  current.value = item
}

function toggleCurrentLike() {
  if (current.value) toggle(current.value)
}
</script>

<template>
  <!-- 加载条撑开一段高度把列表顶下去，加载完收起，列表随之上移 -->
  <Transition name="loader">
    <div v-if="loading" class="loader">
      <AppSpinner />
    </div>
  </Transition>

  <p v-if="isEmpty && emptyText" class="empty">{{ emptyText }}</p>

  <ContentWaterfall :items="items" :liked-ids="likedIds" @like="toggle" @open="openDetail" />

  <ContentDetailDialog
    :detail="detail"
    :origin="origin"
    :liked="currentLiked"
    @like="toggleCurrentLike"
    @close="current = null"
  />
</template>

<style scoped>
.loader {
  display: grid;
  height: 72px;
  place-items: center;
  overflow: hidden;
}

.loader-enter-active,
.loader-leave-active {
  transition: height var(--duration) var(--ease), opacity var(--duration) var(--ease);
}

.loader-enter-from,
.loader-leave-to {
  height: 0;
  opacity: 0;
}

.empty {
  padding: var(--space-10) 0;
  color: var(--color-text-tertiary);
  font-size: var(--font-sm);
  text-align: center;
}
</style>
