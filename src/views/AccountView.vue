<script setup lang="ts">
/**
 * 管理账号。目前两块：收货地址（活动奖品、周边寄送用）与注销账号。
 * 数据先用假数据，接口就绪后替换 config/account 里的几个 create* 即可。
 */
import { computed, ref } from 'vue'
import AppButton from '@/components/base/AppButton.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import AppModal from '@/components/base/AppModal.vue'
import AppPage from '@/components/base/AppPage.vue'
import { useToastStore } from '@/stores/toast'
import { maskPhone } from '@/utils/format'
import {
  ACCOUNT_ADDRESS_EMPTY,
  ACCOUNT_DELETE_DESC,
  ACCOUNT_DELETE_ETA,
  ACCOUNT_DELETE_MESSAGE,
  ACCOUNT_DELETE_MESSAGE_HINT,
  ACCOUNT_DELETE_MESSAGE_LABEL,
  ACCOUNT_DELETE_QRCODE,
  ACCOUNT_DELETE_QRCODE_HINT,
  ACCOUNT_DELETE_TITLE,
  ADDRESS_MAX,
  createEmptyAddress,
  createMockAddresses,
  type Address,
} from '@/config/account'

const toast = useToastStore()

/** TODO: 接口就绪后改为请求 */
const addresses = ref<Address[]>(createMockAddresses())

const canAdd = computed(() => addresses.value.length < ADDRESS_MAX)

/* ── 地址表单 ── */
const formOpen = ref(false)
/** 正在编辑的地址 id；null 表示新建 */
const editingId = ref<string | null>(null)
const form = ref(createEmptyAddress())

const formTitle = computed(() => (editingId.value === null ? '新增收货地址' : '编辑收货地址'))
/** 手机号只做长度与前缀校验，真正的校验以后端为准 */
const phoneValid = computed(() => /^1\d{10}$/.test(form.value.phone))
const formValid = computed(
  () =>
    form.value.name.trim().length > 0 &&
    phoneValid.value &&
    form.value.detail.trim().length > 0,
)

function openCreate() {
  if (!canAdd.value) return
  editingId.value = null
  form.value = createEmptyAddress()
  // 第一条地址直接默认，省一次「设为默认」的操作
  form.value.isDefault = addresses.value.length === 0
  formOpen.value = true
}

function openEdit(address: Address) {
  editingId.value = address.id
  // 拷一份再改：直接改原对象的话，取消也会留下痕迹
  form.value = { ...address }
  formOpen.value = true
}

/** 默认地址全局唯一，设新的就把旧的摘掉 */
function applyDefault(id: string) {
  addresses.value = addresses.value.map((item) => ({ ...item, isDefault: item.id === id }))
}

/* 列表里点「设为默认」走这层：保存、删除也会调 applyDefault，
   提示写在里面的话，保存一条地址会连着弹两条 */
function setDefault(id: string) {
  applyDefault(id)
  toast.show('已设为默认地址')
}

function saveAddress() {
  if (!formValid.value) return
  const value = form.value

  if (editingId.value === null) {
    // TODO: 接口返回真实 id 后替换
    const id = `a${Date.now()}`
    addresses.value = [...addresses.value, { ...value, id }]
    if (value.isDefault) applyDefault(id)
  } else {
    const id = editingId.value
    addresses.value = addresses.value.map((item) => (item.id === id ? { ...item, ...value } : item))
    if (value.isDefault) applyDefault(id)
  }

  formOpen.value = false
  // 弹窗一关，页面上多/改了一条地址不一定看得出来，给句回执
  toast.show(editingId.value === null ? '地址已添加' : '地址已保存')
}

/* ── 删除地址 ── */
const removingId = ref<string | null>(null)
const removeOpen = computed({
  get: () => removingId.value !== null,
  set: (value) => {
    if (!value) removingId.value = null
  },
})

function removeAddress() {
  const id = removingId.value
  if (id === null) return
  const removed = addresses.value.find((item) => item.id === id)
  addresses.value = addresses.value.filter((item) => item.id !== id)
  // 删掉的是默认地址时，把默认顺延给第一条，否则寄件时没有默认可用
  const first = addresses.value[0]
  if (removed?.isDefault && first) applyDefault(first.id)
  removingId.value = null
  toast.show('地址已删除')
}

/* ── 注销账号 ── */
/* 注销走公众号人工受理，站内不自助注销，所以这里只有一个说明弹窗 */
const deleteOpen = ref(false)
</script>

<template>
  <AppPage title="管理账号" description="收货地址与账号安全">
    <section class="block">
      <header class="block__head">
        <h2 class="block__title">
          <AppIcon class="block__icon" name="mapPin" :size="18" />
          收货地址
        </h2>
        <!-- 斜杠两边留空格：13px 下 2/3 挤成一团，读着像一个数 -->
        <span class="block__hint">{{ addresses.length }} / {{ ADDRESS_MAX }}</span>
        <AppButton class="block__action" variant="primary" :disabled="!canAdd" @click="openCreate">
          <AppIcon name="plus" :size="16" />
          新增地址
        </AppButton>
      </header>

      <p v-if="!addresses.length" class="empty">{{ ACCOUNT_ADDRESS_EMPTY }}</p>

      <ul v-else class="addresses">
        <li
          v-for="address in addresses"
          :key="address.id"
          class="address"
          :class="{ 'address--default': address.isDefault }"
        >
          <div class="address__main">
            <p class="address__top">
              <strong class="address__name">{{ address.name }}</strong>
              <span class="address__phone">{{ maskPhone(address.phone) }}</span>
              <span v-if="address.isDefault" class="address__tag">默认</span>
            </p>
            <p class="address__detail">{{ address.detail }}</p>
          </div>

          <div class="address__acts">
            <button
              v-if="!address.isDefault"
              class="address__act"
              type="button"
              @click="setDefault(address.id)"
            >
              设为默认
            </button>
            <button class="address__act" type="button" @click="openEdit(address)">编辑</button>
            <button
              class="address__act address__act--danger"
              type="button"
              @click="removingId = address.id"
            >
              删除
            </button>
          </div>
        </li>
      </ul>
    </section>

    <!-- 注销放在最后，与上面的日常设置拉开距离，并整块做成危险区 -->
    <section class="block danger">
      <header class="block__head">
        <h2 class="block__title">
          <AppIcon class="block__icon" name="alert" :size="18" />
          {{ ACCOUNT_DELETE_TITLE }}
        </h2>
      </header>
      <div class="danger__body">
        <p class="danger__desc">{{ ACCOUNT_DELETE_DESC }}</p>
        <AppButton class="danger__action" variant="danger-outline" @click="deleteOpen = true">
          注销账号
        </AppButton>
      </div>
    </section>
  </AppPage>

  <!-- 地址表单 -->
  <AppModal v-model="formOpen" :title="formTitle" width="480px">
    <div class="form">
      <label class="field">
        <span class="field__label">收货人</span>
        <input v-model="form.name" class="field__input" type="text" maxlength="20" />
      </label>

      <label class="field">
        <span class="field__label">手机号</span>
        <input v-model="form.phone" class="field__input" type="tel" maxlength="11" inputmode="numeric" />
        <!-- 只在填了但不合法时提示，空着时不报错 -->
        <span v-if="form.phone && !phoneValid" class="field__error">手机号格式不对</span>
      </label>

      <label class="field">
        <span class="field__label">详细地址</span>
        <textarea
          v-model="form.detail"
          class="field__input field__input--area"
          rows="2"
          maxlength="60"
          placeholder="街道、门牌号、楼层等"
        />
      </label>

      <label class="check">
        <input v-model="form.isDefault" type="checkbox" />
        设为默认地址
      </label>
    </div>

    <template #footer>
      <AppButton @click="formOpen = false">取消</AppButton>
      <AppButton variant="primary" :disabled="!formValid" @click="saveAddress">保存</AppButton>
    </template>
  </AppModal>

  <!-- 删除地址二次确认 -->
  <AppModal v-model="removeOpen" title="删除地址">
    <p class="confirm">删除后不可恢复，确定删除这条收货地址吗？</p>
    <template #footer>
      <AppButton @click="removeOpen = false">取消</AppButton>
      <AppButton variant="danger" @click="removeAddress">删除</AppButton>
    </template>
  </AppModal>

  <!-- 注销说明：站内不自助注销，引导到公众号人工受理 -->
  <AppModal v-model="deleteOpen" :title="ACCOUNT_DELETE_TITLE">
    <!--
      主角是二维码与那句要照抄的留言 —— 打开这个弹窗的人是来办事的，
      「怎么办」放最上面且最大；后果说明退到最下面一档灰。
    -->
    <figure class="qrcode">
      <img
        v-if="ACCOUNT_DELETE_QRCODE"
        class="qrcode__img"
        :src="ACCOUNT_DELETE_QRCODE"
        alt="公众号二维码"
      />
      <!-- 二维码没就位时留个同尺寸占位，弹窗高度不会等图片来了再跳一次 -->
      <span v-else class="qrcode__img qrcode__img--empty">二维码待补</span>
      <figcaption class="qrcode__hint">{{ ACCOUNT_DELETE_QRCODE_HINT }}</figcaption>
    </figure>

    <p class="guide__label">{{ ACCOUNT_DELETE_MESSAGE_LABEL }}</p>
    <!-- 留言内容单独裱起来：这是唯一需要一字不差照抄的东西 -->
    <p class="guide__message">{{ ACCOUNT_DELETE_MESSAGE }}</p>
    <p class="guide__hint">{{ ACCOUNT_DELETE_MESSAGE_HINT }}</p>
    <p class="guide__eta">{{ ACCOUNT_DELETE_ETA }}</p>

    <p class="confirm confirm--note">{{ ACCOUNT_DELETE_DESC }}</p>

    <template #footer>
      <AppButton @click="deleteOpen = false">我知道了</AppButton>
    </template>
  </AppModal>
</template>

<style scoped>
.block {
  margin-bottom: var(--space-8);
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
}

/*
 * 标题栏。分隔线拉满整块宽度（靠负外边距顶掉容器内边距），
 * 卡片的「头」和「身」才分得开，而不是一行字浮在内容上方。
 */
.block__head {
  display: flex;
  /*
   * 垂直居中，不用基线对齐：标题里有个 18px 的图标把行盒撑高了，
   * 基线是按文字算的，计数会被顶到偏上的位置。
   */
  align-items: center;
  gap: var(--space-3);
  margin: 0 calc(var(--space-5) * -1) var(--space-4);
  padding: 0 var(--space-5) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.block__title {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  font-size: var(--font-lg);
  font-weight: 600;
  letter-spacing: -0.01em;
}

/* 图标只是标识，压一档字色，不跟标题抢 */
.block__icon {
  color: var(--color-text-tertiary);
}

/* 注销那块的图标给危险色 —— 这里正需要一眼看出性质不同 */
.danger .block__icon {
  color: var(--color-danger);
}

/* 数字用等宽字形，2/3 变 3/3 时不跳位 */
.block__hint {
  color: var(--color-text-tertiary);
  font-size: var(--font-sm);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

/* 长相归 AppButton，这里只管把它推到标题栏行尾 */
.block__action {
  margin-left: auto;
}

.empty {
  padding: var(--space-8) 0;
  color: var(--color-text-tertiary);
  font-size: var(--font-sm);
  text-align: center;
}

/* ── 地址列表 ── */
.addresses {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/*
 * 每条地址是一张独立小卡，而不是靠分隔线切开的行：
 * 一条地址内部有三行信息（姓名/电话、地址、操作），只用一条细线分隔时
 * 行与行的归属看不清，卡片边界能把「一条地址」框成一个整体。
 */
.address {
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: border-color var(--duration) var(--ease), background var(--duration) var(--ease);
}

.address:hover {
  border-color: var(--color-border-strong);
  background: var(--color-bg-sunken);
}

/* 默认地址描一圈品牌色，扫一眼就知道寄件默认走哪条 */
.address--default {
  border-color: var(--color-accent);
}

.address__main {
  min-width: 0;
  flex: 1;
}

.address__top {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.address__name {
  font-size: var(--font-md);
  font-weight: 600;
}

.address__phone {
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
  font-variant-numeric: tabular-nums;
  /* 打码后的星号与数字混排，字距略松一点更好读 */
  letter-spacing: 0.02em;
}

/* 描边小标签，不用实心块 —— 实心色块在一行文字里比姓名还抢眼 */
.address__tag {
  padding: 0 var(--space-2);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-sm);
  color: var(--color-accent);
  font-size: var(--font-xs);
  line-height: 18px;
}

.address__detail {
  margin-top: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
  line-height: 1.6;
  overflow-wrap: break-word;
}

/*
 * 操作平时压到最浅一档，hover 到卡片上才提亮 ——
 * 三条地址就是九个按钮，全都常亮会盖过地址本身。
 */
.address__acts {
  display: flex;
  gap: var(--space-1);
  flex-shrink: 0;
  opacity: 0.75;
  transition: opacity var(--duration) var(--ease);
}

.address:hover .address__acts {
  opacity: 1;
}

.address__act {
  height: 28px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  font-size: var(--font-sm);
  white-space: nowrap;
  cursor: pointer;
  transition: background var(--duration) var(--ease), color var(--duration) var(--ease);
}

.address__act:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

/* 触屏没有 hover，操作直接给到常亮 */
@media (hover: none) {
  .address__acts {
    opacity: 1;
  }
}

.address__act--danger:hover {
  color: var(--color-danger);
}

/* ── 危险区 ── */
/* 说明文字与按钮左右分开，宽屏下不必让一行短按钮孤零零挂在长段落下面 */
.danger__body {
  display: flex;
  gap: var(--space-5);
  align-items: center;
}

.danger__desc {
  min-width: 0;
  flex: 1;
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
  line-height: 1.6;
}

/* 描边红（danger 变体）在页面上不抢视线，而这是个几乎没人该点的操作 */
.danger__action {
  padding: 0 var(--space-5);
}

/* ── 表单 ── */
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-bottom: var(--space-2);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field__label {
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
}

.field__input {
  width: 100%;
  height: 36px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-text);
  font: inherit;
  font-size: var(--font-sm);
  outline: none;
  transition: border-color var(--duration) var(--ease);
}

.field__input:focus {
  border-color: var(--color-accent);
}

.field__input::placeholder {
  color: var(--color-text-tertiary);
}

.field__input--area {
  height: auto;
  padding: var(--space-2) var(--space-3);
  line-height: 1.6;
  resize: none;
}

.field__error {
  color: var(--color-danger);
  font-size: var(--font-xs);
}

.check {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  align-self: flex-start;
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
  cursor: pointer;
}

/*
 * 原生复选框默认走系统强调色（macOS/Windows 都是蓝），
 * 站内一个紫色主题里冒出一个蓝勾很突兀 —— 用 accent-color 交回品牌色。
 */
.check input {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--color-accent);
  cursor: pointer;
}

.confirm {
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
  line-height: 1.6;
}

.confirm__hint {
  margin: var(--space-4) 0 var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
  line-height: 1.6;
}

/*
 * 后果说明退成脚注：它重要，但不是打开弹窗的人此刻要读的东西 ——
 * 上一版它顶在最前面，一进来先撞上一段长灰字，真正要做的事反而排在后面。
 */
.confirm--note {
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
  color: var(--color-text-tertiary);
  font-size: var(--font-xs);
}

/* ── 注销指引 ── */
.guide__label {
  margin-top: var(--space-5);
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
  text-align: center;
}

/* 要照抄的留言：全弹窗最大最重的一行，其余元素都比它轻 */
.guide__message {
  margin-top: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-bg-sunken);
  color: var(--color-text);
  font-size: var(--font-lg);
  font-weight: 600;
  text-align: center;
  /* 号码要被人选中复制，别当成普通文案禁选 */
  user-select: all;
}

/* 紧贴留言框，说明它是对上一行的注解，不是新的一条信息 */
.guide__hint {
  margin-top: var(--space-2);
  color: var(--color-text-tertiary);
  font-size: var(--font-xs);
  text-align: center;
}

.guide__eta {
  margin-top: var(--space-3);
  color: var(--color-text-tertiary);
  font-size: var(--font-xs);
  text-align: center;
}

/* ── 公众号二维码 ── */
.qrcode {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: center;
  margin: var(--space-5) 0 var(--space-2);
}

.qrcode__img {
  width: 160px;
  height: 160px;
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-qr-bg);
}

.qrcode__img--empty {
  display: grid;
  background: var(--color-bg-sunken);
  color: var(--color-text-tertiary);
  font-size: var(--font-xs);
  place-items: center;
}

.qrcode__hint {
  color: var(--color-text-tertiary);
  font-size: var(--font-xs);
}


.btn:disabled {
  background: var(--color-border-strong);
  color: var(--color-text-tertiary);
  cursor: not-allowed;
}

@media (max-width: 767px) {
  /* 窄屏地址卡改上下，操作行落到详情下面，避免右侧三个按钮把地址挤成一列字 */
  .address {
    flex-direction: column;
    gap: var(--space-3);
  }

  .address__acts {
    margin-left: auto;
  }

  /* 窄屏一行放不下「长段落 + 按钮」，改上下并让按钮靠右 */
  .danger__body {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-4);
  }
}
</style>
