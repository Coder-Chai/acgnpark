/**
 * 首页版面配置：分区标签、轮播、推荐卡片。
 * 内容列表与详情的假数据在 config/content.ts，不混在这里 ——
 * 那一堆接了接口就要整个删掉，而本文件是长期要留的运营配置。
 */
import type { RouteRecordName } from 'vue-router'
import { CREATE_STATION_URL } from '@/config/site'

export interface CarouselSlide {
  id: string
  title: string
  subtitle?: string
  image?: string
  to?: RouteRecordName
  href?: string
}

export interface ShowcaseCard {
  id: string
  title: string
  subtitle?: string
  image?: string
  to?: RouteRecordName
}

/** 首页内容分区。key 会写进地址栏 query，刷新后仍停留在当前分区。 */
export const HOME_TABS = [
  { key: 'recommend', label: '推荐' },
  { key: 'latest', label: '最新' },
  { key: 'illustration', label: '插画' },
  { key: 'character', label: '角色' },
  { key: 'model', label: '模型' },
  { key: 'following', label: '关注' },
] as const

export type HomeTabKey = (typeof HOME_TABS)[number]['key']

export const DEFAULT_HOME_TAB: HomeTabKey = 'recommend'

export function isHomeTabKey(value: unknown): value is HomeTabKey {
  return HOME_TABS.some((tab) => tab.key === value)
}

/** image 暂用在线占位图（picsum），替换成运营图即可 */
export const CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    id: 's1',
    title: '次元公园开园',
    subtitle: '一起来创作属于你的角色',
    image: 'https://picsum.photos/seed/acgnpark-1/960/400',
    to: 'explore',
  },
  {
    id: 's2',
    title: '本周热门模型',
    subtitle: '社区精选 20 款',
    image: 'https://picsum.photos/seed/acgnpark-2/960/400',
  },
  {
    id: 's3',
    title: '新人指引',
    subtitle: '三步产出第一张作品',
    image: 'https://picsum.photos/seed/acgnpark-3/960/400',
    // 创作台是独立子站，走外链而不是站内路由
    href: CREATE_STATION_URL,
  },
]

export const SHOWCASE_CARDS: ShowcaseCard[] = [
  /* TODO: 活动页就绪后补 to，指向活动列表；暂时不留旧的 create 路由，免得点进去是不相干的页面 */
  { id: 'c1', title: '精彩活动', subtitle: '近期征稿与联动' },
  { id: 'c2', title: '模型库', subtitle: '风格与角色模型' },
  { id: 'c3', title: '活动中心', subtitle: '参与赢取奖励', to: 'explore' },
]

