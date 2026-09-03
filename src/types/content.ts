/**
 * 内容领域模型。
 * 首页、探索、收藏、作品等列表共用同一套卡片数据结构，
 * 接口字段不同时在各自的 api 层做一次映射，组件不感知来源。
 */
export interface ContentItem {
  id: string
  title: string
  author: string
  /** 作者头像地址，为空时卡片降级为文字头像 */
  avatar?: string
  likes: number
  /** 封面宽高比，瀑布流按此排布，避免图片加载后跳动 */
  ratio: number
  /** 封面地址，为空时展示占位渐变 */
  cover?: string
}

/** 评论。replies 只做一层，二级以下在列表里平铺（与主流社区一致）。 */
export interface ContentComment {
  id: string
  author: string
  avatar?: string
  text: string
  /** 已格式化的时间文案，如「07-08」 */
  date: string
  /** 归属地，为空不展示 */
  region?: string
  likes: number
  /** 作者本人的评论会挂一个「作者」角标 */
  isAuthor?: boolean
  replies?: ContentComment[]
}

/**
 * 内容详情。列表项的超集 —— 详情弹窗直接拿列表数据先渲染骨架，
 * 再用接口返回的完整字段覆盖，避免打开瞬间一片空白。
 */
export interface ContentDetail extends ContentItem {
  /** 图集。为空时退回单张 cover */
  images?: string[]
  /** 正文描述，标题之下那段 */
  desc?: string
  /** 话题标签，不含 # 前缀 */
  tags?: string[]
  /** 发布/编辑时间文案 */
  date?: string
  collects: number
  comments: ContentComment[]
  /** 评论总数。可能大于 comments.length（列表分页返回） */
  commentCount: number
}
