/**
 * 导航配置 —— 侧边栏与底部 TabBar 的唯一数据源。
 * 布局组件只负责渲染，不持有任何导航业务知识；新增页面改这里即可。
 */
import type { RouteRecordName } from 'vue-router'
import type { IconName } from '@/components/base/icons'

export interface NavItem {
  /** 对应路由的 name，用于导航与高亮判定；同时作为列表 key */
  name: RouteRecordName
  label: string
  icon: IconName
  /**
   * 站外地址。有值时该项不走路由，改为新窗口打开并显示外链箭头。
   * 创作台是独立子站，与主站分开部署，所以走外链而非路由。
   */
  href?: string
  /** 是否出现在移动端底部 TabBar（TabBar 容量有限，只放主入口） */
  inTabBar?: boolean
}

export interface NavGroup {
  /** 分组标题，为空表示无标题分组 */
  title?: string
  /** 层级：1 为主入口，2 为标题分组下的二级菜单（字号更小） */
  level?: 1 | 2
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { name: 'home', label: '首页', icon: 'home', inTabBar: true },
      // 暂不上线，页面就绪后取消注释即可
      // { name: 'explore', label: '探索', icon: 'compass', inTabBar: true },
      // {
      //   name: 'create',
      //   label: '创作',
      //   icon: 'sparkles',
      //   href: CREATE_STATION_URL, // 从 @/config/site 引入
      //   inTabBar: true,
      // },
    ],
  },
  {
    items: [
      // { name: 'notifications', label: '消息', icon: 'bell', inTabBar: true },
      { name: 'profile', label: '我的', icon: 'user', inTabBar: true },
    ],
  },
]

/**
 * 顶栏头像点开后的账号菜单。
 * 只放「跟这个账号有关」的入口 —— 首页、探索这类内容入口归侧边栏，
 * 两处重复摆会让人分不清该从哪儿走。退出登录是动作不是页面，另外单列。
 */
export const USER_MENU_ITEMS: NavItem[] = [
  { name: 'profile', label: '我的主页', icon: 'user' },
  { name: 'account', label: '管理账号', icon: 'sliders' },
]

/** 扁平化后的全部导航项 */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items)

/** 移动端底部 TabBar 展示的导航项 */
export const TABBAR_ITEMS: NavItem[] = NAV_ITEMS.filter((item) => item.inTabBar)
