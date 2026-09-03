/**
 * 个人页配置：分区标签、文案与假数据。
 * 页面只读这里的常量，接口就绪后把 createMockProfile 换成请求，视图不用改。
 */
import type { ContentItem } from '@/types/content'
import { createMockFeed } from '@/config/content'

/** 个人页分区。key 会写进地址栏 query，与首页分区同一套做法 */
export const PROFILE_TABS = [
  { key: 'posts', label: '帖子' },
  { key: 'collects', label: '收藏' },
  { key: 'likes', label: '赞过' },
] as const

export type ProfileTabKey = (typeof PROFILE_TABS)[number]['key']

export const DEFAULT_PROFILE_TAB: ProfileTabKey = 'posts'

export function isProfileTabKey(value: unknown): value is ProfileTabKey {
  return PROFILE_TABS.some((tab) => tab.key === value)
}

/** 各分区空着时的一句话。分区不同，空的原因也不同，别共用一句「暂无内容」 */
export const PROFILE_EMPTY_TEXT: Record<ProfileTabKey, string> = {
  posts: '还没有发过帖子，去首页发一条吧',
  collects: '还没有收藏，逛到喜欢的记得点个收藏',
  likes: '还没有点过赞',
}

/** 未登录时的引导文案 */
export const PROFILE_GUEST_TITLE = '登录后开始逛'
export const PROFILE_GUEST_DESC = '登录即可发帖、评论、收藏喜欢的内容'

export interface ProfileStat {
  key: string
  label: string
  value: number
}

export interface Profile {
  name: string
  avatar?: string
  /** 站内唯一号，可复制、可搜索 */
  uid: string
  bio: string
  stats: ProfileStat[]
}

/**
 * 假数据。TODO: 接口就绪后整段删除。
 * 网名与次元号取自登录态（顶栏菜单也要显示次元号，两处得是同一个号），
 * 其余字段先给一份看得出排版的值。
 */
export function createMockProfile(name: string, uid: string): Profile {
  return {
    name,
    uid,
    bio: '画画的，偶尔写点摸鱼日志。约稿看主页置顶',
    stats: [
      { key: 'following', label: '关注', value: 132 },
      { key: 'followers', label: '粉丝', value: 18420 },
      { key: 'received', label: '获赞与收藏', value: 236500 },
    ],
  }
}

/** 各分区的假列表。用不同条数让空态、满态都能看到。 */
const MOCK_COUNTS: Record<ProfileTabKey, number> = {
  posts: 14,
  collects: 8,
  likes: 0,
}

/** TODO: 接口就绪后换成按分区分页请求 */
export function createMockProfileFeed(tab: ProfileTabKey): ContentItem[] {
  return createMockFeed(`profile-${tab}`, MOCK_COUNTS[tab])
}
