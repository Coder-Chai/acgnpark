<script setup lang="ts">
/**
 * 我的。上半是资料区（头像、网名、次元号、简介、数据），下半是帖子/收藏/赞过三个分区。
 * 未登录时整页换成一块登录引导 —— 个人页没有可看的公共内容，
 * 直接给空资料卡等于让人对着一堆「0」发呆。
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/base/AppButton.vue'
import AppCopyText from '@/components/base/AppCopyText.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import AppTabs from '@/components/base/AppTabs.vue'
import ContentCollection from '@/components/content/ContentCollection.vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { formatCount } from '@/utils/format'
import {
  DEFAULT_PROFILE_TAB,
  PROFILE_EMPTY_TEXT,
  PROFILE_GUEST_DESC,
  PROFILE_GUEST_TITLE,
  PROFILE_TABS,
  createMockProfile,
  createMockProfileFeed,
  isProfileTabKey,
  type ProfileTabKey,
} from '@/config/profile'
import type { ContentItem } from '@/types/content'

const auth = useAuthStore()
const toast = useToastStore()
const route = useRoute()
const router = useRouter()

/** TODO: 接口就绪后按当前用户请求资料，createMockProfile 一并删除 */
const profile = computed(() =>
  auth.user ? createMockProfile(auth.user.name, auth.user.uid) : null,
)

/** 头像缺失时降级为网名首字，与卡片、顶栏的处理保持一致 */
const initial = computed(() => profile.value?.name.slice(0, 1) ?? '')

/**
 * 个性签名。就地编辑：签名本身是虚线框，点一下变输入框，
 * 不为一行字单开一个资料编辑页。
 * 本地留一份 bio，是因为资料整体来自接口（现在是假数据），
 * 编辑只改这一个字段，改完不该等整份资料重新拉一次。
 * TODO: 接口就绪后在 save 里提交，失败回滚到 draft 之前的值。
 */
const BIO_MAX = 60
const BIO_PLACEHOLDER = '点击填写个性签名'

const bio = ref('')
const editingBio = ref(false)
const bioDraft = ref('')
const bioEl = ref<HTMLTextAreaElement | null>(null)

// 资料到位（或换了账号）后同步一次本地副本
watch(profile, (value) => (bio.value = value?.bio ?? ''), { immediate: true })

async function startEditBio() {
  bioDraft.value = bio.value
  editingBio.value = true
  // 等 textarea 渲染出来再聚焦，并把光标放到末尾（接着写而不是覆盖）
  await nextTick()
  const el = bioEl.value
  if (!el) return
  el.focus()
  el.setSelectionRange(el.value.length, el.value.length)
}

function saveBio() {
  if (!editingBio.value) return
  // 首尾空格不落库，否则会出现看不见的「有内容」
  const next = bioDraft.value.trim()
  const changed = next !== bio.value
  bio.value = next
  editingBio.value = false
  // 没改就别报「已保存」—— 点开又关上不算做了什么
  if (changed) toast.show('签名已保存')
}

function cancelEditBio() {
  editingBio.value = false
}

/**
 * 网名同样就地编辑。与签名不同的是不在本地留副本：
 * 网名归 auth store（顶栏、抽屉都读它），改完那几处要一起变。
 */
const NAME_MAX = 20

const editingName = ref(false)
const nameDraft = ref('')
const nameEl = ref<HTMLInputElement | null>(null)

async function startEditName() {
  nameDraft.value = profile.value?.name ?? ''
  editingName.value = true
  await nextTick()
  nameEl.value?.select()
}

function saveName() {
  if (!editingName.value) return
  editingName.value = false
  const next = nameDraft.value.trim()
  // 空名字不落库，直接当作没改（rename 内部也会拦一次）
  if (!next || next === profile.value?.name) return
  auth.rename(next)
  toast.show('网名已保存')
}

function cancelEditName() {
  editingName.value = false
}

/**
 * 选中分区存在地址栏 query 里而不是组件内部：
 * 刷新、前进后退、分享链接都能回到同一个分区（与首页同一套做法）。
 */
const activeTab = computed<ProfileTabKey>({
  get: () => (isProfileTabKey(route.query.tab) ? route.query.tab : DEFAULT_PROFILE_TAB),
  set: (key) => {
    const tab = key === DEFAULT_PROFILE_TAB ? undefined : key
    router.replace({ query: { ...route.query, tab } })
  },
})

/** 模拟网络耗时，接真实接口后连同 setTimeout 一起删掉 */
const MOCK_LATENCY = 500

const items = ref<ContentItem[]>([])
const loading = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

watch(
  // 未登录不取数：登录后这里会跟着重跑
  () => [activeTab.value, auth.isLoggedIn] as const,
  ([tab, logged]) => {
    clearTimeout(timer)
    if (!logged) {
      items.value = []
      loading.value = false
      return
    }
    loading.value = true
    // 连续快速切换时丢弃上一次的等待，避免旧结果覆盖新分区
    timer = setTimeout(() => {
      items.value = createMockProfileFeed(tab)
      loading.value = false
    }, MOCK_LATENCY)
  },
  { immediate: true },
)

onBeforeUnmount(() => clearTimeout(timer))

/** 分区标签带上条数，不用点进去才知道有没有东西 */
const tabs = computed(() =>
  PROFILE_TABS.map((tab) => ({
    ...tab,
    badge: tab.key === activeTab.value && !loading.value ? formatCount(items.value.length) : undefined,
  })),
)
</script>

<template>
  <div class="profile">
    <!-- 未登录：整页只留一块引导，点了唤起全站同一个登录弹窗 -->
    <div v-if="!profile" class="guest">
      <span class="guest__avatar" aria-hidden="true">
        <AppIcon name="user" :size="28" />
      </span>
      <h1 class="guest__title">{{ PROFILE_GUEST_TITLE }}</h1>
      <p class="guest__desc">{{ PROFILE_GUEST_DESC }}</p>
      <AppButton class="guest__cta" variant="primary" @click="auth.openLoginDialog()">
        登录 / 注册
      </AppButton>
    </div>

    <template v-else>
      <header class="hero">
        <img v-if="profile.avatar" class="hero__avatar" :src="profile.avatar" :alt="profile.name" />
        <span v-else class="hero__avatar hero__avatar--text" aria-hidden="true">{{ initial }}</span>

        <div class="hero__main">
          <div class="hero__top">
            <!-- 网名也能就地改：铅笔紧贴名字右侧，点名字本身不触发，避免误改 -->
            <template v-if="!editingName">
              <h1 class="hero__name">{{ profile.name }}</h1>
              <button class="hero__pen" type="button" @click="startEditName">
                <AppIcon name="pencil" :size="14" />
                改名
              </button>
            </template>

            <!-- 编辑态：输入框 + 取消/保存，与签名那块同一套操作，不靠失焦猜用户想不想存 -->
            <div v-else class="rename">
              <input
                ref="nameEl"
                v-model="nameDraft"
                class="rename__field"
                type="text"
                :maxlength="NAME_MAX"
                aria-label="网名"
                @keydown.enter.prevent="saveName"
                @keydown.esc.prevent="cancelEditName"
              />
              <AppButton class="rename__btn" @click="cancelEditName">取消</AppButton>
              <AppButton class="rename__btn" variant="primary" @click="saveName">保存</AppButton>
            </div>

            <RouterLink class="hero__edit" :to="{ name: 'account' }">管理账号</RouterLink>
          </div>

          <!-- 次元号要报给客服、写进公众号留言，点一下整串抄走 -->
          <AppCopyText
            class="hero__uid"
            :value="profile.uid"
            :label="`次元号：${profile.uid}`"
            message="已复制次元号"
          />
          <!--
            签名就地编辑。未编辑时是一个虚线框按钮（虚线本身就在说「这里可以填」），
            点开后换成 textarea：回车保存，Shift+Enter 换行，Esc 放弃，失焦按保存处理。
          -->
          <button v-if="!editingBio" class="bio" type="button" @click="startEditBio">
            <span :class="{ 'bio__text--empty': !bio }">{{ bio || BIO_PLACEHOLDER }}</span>
            <AppIcon class="bio__pen" name="pencil" :size="14" />
          </button>

          <div v-else class="bio bio--editing">
            <textarea
              ref="bioEl"
              v-model="bioDraft"
              class="bio__field"
              rows="2"
              :maxlength="BIO_MAX"
              :placeholder="BIO_PLACEHOLDER"
              aria-label="个性签名"
              @blur="saveBio"
              @keydown.enter.exact.prevent="saveBio"
              @keydown.esc.prevent="cancelEditBio"
            />
            <div class="bio__foot">
              <span class="bio__count">{{ bioDraft.length }}/{{ BIO_MAX }}</span>
              <!--
                两个按钮都走 mousedown.prevent：点它们会先触发 textarea 的 blur，
                保存会执行两次，取消更糟 —— blur 先把草稿存了，取消就不取消了。
              -->
              <AppButton class="bio__cancel" size="sm" @mousedown.prevent @click="cancelEditBio">
                取消
              </AppButton>
              <AppButton class="bio__save" size="sm" variant="primary" @mousedown.prevent @click="saveBio">
                保存
              </AppButton>
            </div>
          </div>

          <ul class="stats">
            <li v-for="stat in profile.stats" :key="stat.key" class="stats__item">
              <!-- 名称在上、数字在下：先读懂这是什么，再看量级 -->
              <span class="stats__label">{{ stat.label }}</span>
              <strong class="stats__value">{{ formatCount(stat.value) }}</strong>
            </li>
          </ul>
        </div>
      </header>

      <AppTabs v-model="activeTab" class="profile__tabs" :tabs="tabs" />

      <ContentCollection
        :items="items"
        :loading="loading"
        :empty-text="PROFILE_EMPTY_TEXT[activeTab]"
      />
    </template>
  </div>
</template>

<style scoped>
.profile {
  padding: var(--space-6) var(--content-padding-x) var(--space-10);
}

/* ── 未登录引导 ── */
/*
 * 未登录时页面上只有这一块，靠上摆会显得整页是空的；
 * 撑到视口高度的一大半再上下居中，让它落在视线中央。
 * 减掉顶栏与自身上下内边距，避免超出一屏又多出滚动条。
 */
.guest {
  display: flex;
  min-height: calc(100vh - var(--header-height) - var(--space-10) * 2);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-10) var(--space-5);
  text-align: center;
}

.guest__avatar {
  display: grid;
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  background: var(--color-bg-sunken);
  color: var(--color-text-tertiary);
  place-items: center;
}

.guest__title {
  margin-top: var(--space-5);
  font-size: var(--font-xl);
  font-weight: 700;
}

.guest__desc {
  margin-top: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
}

/* 空页面上唯一的动作，给它比常规按钮更宽的横向留白 */
.guest__cta {
  height: 40px;
  margin-top: var(--space-6);
  padding: 0 var(--space-8);
  font-size: var(--font-md);
}

/* ── 资料区 ── */
.hero {
  display: flex;
  gap: var(--space-5);
  align-items: flex-start;
}

.hero__avatar {
  width: 88px;
  height: 88px;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  object-fit: cover;
}

.hero__avatar--text {
  display: grid;
  background: var(--color-brand-soft);
  color: var(--color-brand);
  font-size: var(--font-2xl);
  font-weight: 600;
  place-items: center;
}

.hero__main {
  min-width: 0;
  flex: 1;
}

.hero__top {
  display: flex;
  gap: var(--space-4);
  align-items: center;
}

.hero__name {
  font-size: var(--font-xl);
  font-weight: 700;
  letter-spacing: -0.01em;
}

/*
 * 网名旁的编辑入口。给虚线框而不是裸图标 —— 签名那块的「可改」是靠虚线说出来的，
 * 这里只放一个浅灰图标，两处的提示强度对不上，容易看不见。
 */
.hero__pen {
  display: flex;
  gap: var(--space-1);
  align-items: center;
  height: 24px;
  /* 名字与它是一组，间距比到「编辑资料」的近 */
  margin-left: calc(var(--space-4) * -1 + var(--space-2));
  padding: 0 var(--space-2);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
  font-size: var(--font-xs);
  cursor: pointer;
  transition: border-color var(--duration) var(--ease), background var(--duration) var(--ease),
    color var(--duration) var(--ease);
}

.hero__pen:hover {
  border-color: var(--color-accent);
  background: var(--color-bg-hover);
  color: var(--color-text);
}

/* ── 网名编辑态 ── */
.rename {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  min-width: 0;
  flex: 1;
}

/*
 * 输入框用正文字号，不跟着 h1 的 20px 走 —— 20px 的输入框看着像个横幅，
 * 而且光标、字距在大字号下都偏松，不像在填表单。
 */
.rename__field {
  width: 100%;
  max-width: 220px;
  height: var(--control-height);
  padding: 0 var(--space-3);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text);
  font: inherit;
  font-size: var(--font-md);
  outline: none;
}

/* 挤在输入框旁边，收窄一点横向留白 */
.rename__btn {
  min-width: 56px;
  padding: 0 var(--space-3);
}

/*
 * 编辑资料是次要动作，用描边而不是实心 —— 实心按钮会跟网名抢视觉重心。
 * margin-left: auto 把它推到行尾，网名长短都不影响它的位置。
 */
.hero__edit {
  display: flex;
  align-items: center;
  height: var(--control-height);
  margin-left: auto;
  padding: 0 var(--space-4);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: background var(--duration) var(--ease), color var(--duration) var(--ease);
}

.hero__edit:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

/* 复制交互归 AppCopyText，这里只定位置与字号 */
.hero__uid {
  margin-top: var(--space-2);
  color: var(--color-text-tertiary);
  font-size: var(--font-xs);
}

/*
 * 签名框。两种态共用同一个 .bio 底：内边距、圆角、字号一致，
 * 只有边框从虚线变实线 —— 否则点开的瞬间整块会跳一下位置。
 */
.bio {
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
  width: 100%;
  max-width: 480px;
  margin-top: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
  line-height: 1.6;
  text-align: left;
  cursor: pointer;
  overflow-wrap: break-word;
  transition: border-color var(--duration) var(--ease), background var(--duration) var(--ease);
}

.bio:hover {
  border-color: var(--color-accent);
  background: var(--color-bg-hover);
}

/* 还没填时压一档字色，看得出是提示不是内容 */
.bio__text--empty {
  color: var(--color-text-tertiary);
}

/* 铅笔钉在右侧，不参与文字换行 */
.bio__pen {
  flex-shrink: 0;
  margin-top: 3px;
  margin-left: auto;
  color: var(--color-text-tertiary);
}

.bio--editing {
  flex-direction: column;
  gap: var(--space-2);
  border-style: solid;
  border-color: var(--color-accent);
  background: var(--color-bg-elevated);
  cursor: default;
}

.bio--editing:hover {
  background: var(--color-bg-elevated);
}

.bio__field {
  width: 100%;
  border: none;
  background: none;
  color: var(--color-text);
  font: inherit;
  outline: none;
  resize: none;
}

.bio__field::placeholder {
  color: var(--color-text-tertiary);
}

.bio__foot {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  align-self: stretch;
}

.bio__count {
  color: var(--color-text-tertiary);
  font-size: var(--font-xs);
  font-variant-numeric: tabular-nums;
}

/* 两个按钮靠右：由左边那个把它们一起顶过去 */
.bio__cancel,
.bio__save {
  margin-left: auto;
}

.bio__cancel + .bio__save {
  margin-left: 0;
}

.stats {
  display: flex;
  gap: var(--space-8);
  margin-top: var(--space-5);
}

/*
 * 每项内部居中：三项的名称长短不一（「关注」两字 vs「获赞与收藏」五字），
 * 左对齐时数字会各自偏在一边，读起来是散的；居中后名称与数字共用一条中轴。
 */
.stats__item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  align-items: center;
}

.stats__value {
  font-size: var(--font-lg);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.stats__label {
  color: var(--color-text-tertiary);
  font-size: var(--font-xs);
}

.profile__tabs {
  margin: var(--space-6) 0 var(--space-4);
}

@media (max-width: 767px) {
  .profile {
    padding: var(--space-4) var(--content-padding-x) var(--space-8);
  }

  /*
   * 窄屏改成上下：头像与网名一行放不下三项数据。
   * 头像缩小，数据行横向铺开，间距收紧。
   */
  .hero {
    flex-direction: column;
    gap: var(--space-4);
  }

  .hero__avatar {
    width: 64px;
    height: 64px;
  }

  .hero__main {
    width: 100%;
  }

  .stats {
    gap: var(--space-6);
  }
}
</style>
