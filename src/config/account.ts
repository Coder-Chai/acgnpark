/**
 * 账号管理相关的数据结构与文案。
 * 收货地址用于活动奖品、周边寄送，接口就绪后把 createMockAddresses 换成请求即可。
 */

export interface Address {
  id: string
  /** 收货人 */
  name: string
  phone: string
  /** 完整地址，省市区与街道门牌写在一起 */
  detail: string
  /** 默认地址全局只有一个，寄件时不必再选 */
  isDefault?: boolean
}

/** 新建地址时的空表单 */
export function createEmptyAddress(): Omit<Address, 'id'> {
  return { name: '', phone: '', detail: '', isDefault: false }
}

/** TODO: 接口就绪后整段删除 */
export function createMockAddresses(): Address[] {
  return [
    {
      id: 'a1',
      name: '林小满',
      phone: '13800001234',
      detail: '盈丰街道民和路 483 号 302 室',
      isDefault: true,
    },
    {
      id: 'a2',
      name: '林小满',
      phone: '13900005678',
      detail: '漕河泾开发区宜山路 900 号 B 座 1102',
    },
  ]
}

/** 地址条数上限，与后端保持一致 */
export const ADDRESS_MAX = 3

export const ACCOUNT_ADDRESS_EMPTY = '还没有收货地址，添加一个吧'

/* 注销是不可逆操作，文案要把后果说清楚，不能只写「确定要注销吗」 */
export const ACCOUNT_DELETE_TITLE = '注销账号'
export const ACCOUNT_DELETE_DESC =
  '注销后，账号将被永久删除，发布的帖子、评论、收藏与收货地址一并清除，且无法恢复。'
/*
 * 注销不在站内自助完成，改为走公众号人工受理：
 * 弹窗只负责说清「怎么提」和「多久有回音」，不做任何本地清号动作。
 */
/* 拆成几段而不是一整句：弹窗里「扫码 → 留言 → 等回复」是三步操作，
   连成一段话读者得自己断句，分开摆才能一眼看出先做什么、再做什么 */
/** TODO: 替换成真实公众号二维码 */
export const ACCOUNT_DELETE_QRCODE = ''
export const ACCOUNT_DELETE_QRCODE_HINT = '微信扫一扫，关注公众号'
export const ACCOUNT_DELETE_MESSAGE_LABEL = '在公众号后台留言'
/** 需要照抄的留言内容，「次元号」替换成本人的号 */
export const ACCOUNT_DELETE_MESSAGE = '次元号 + 注销账号'
/* 单独一行提示去哪儿找次元号，不写进留言里：
   那行是给人整段复制的，混进括号说明会被一起抄到公众号后台 */
export const ACCOUNT_DELETE_MESSAGE_HINT = '次元号可在「我的」页面查看'
export const ACCOUNT_DELETE_ETA = '运营小伙伴会在 7 个工作日内处理'
