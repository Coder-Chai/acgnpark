/** 站点信息与页脚链接。文案、备案号、外链集中在此，组件不内联字符串。 */
import type { RouteRecordName } from 'vue-router'
import wechatIcon from '@/assets/wechat.svg'
import xiaohongshuIcon from '@/assets/xiaohongshu.svg'
import tiktokIcon from '@/assets/tiktok.svg'
import registerTitleImage from '@/assets/register_title.png'

export interface SiteLink {
  label: string
  /** 站内路由名 */
  to?: RouteRecordName
  /** 站外地址，与 to 二选一 */
  href?: string
}

export const SITE_NAME = '次元公园 ACGNPARK'

/**
 * 创作台地址。它是独立子站、单独部署，主站没有对应路由，
 * 所以凡是「去创作」的入口都走这个外链 —— 侧边栏、轮播都取这里，
 * 免得一处写外链、一处留着站内占位路由，点进去看到两种结果。
 */
export const CREATE_STATION_URL = 'https://create.acgnpark.com'

/** 社交平台入口。href 为空时按钮禁用，等账号就绪后补链接。 */
export interface SocialLink {
  label: string
  /** 官方彩色 logo */
  icon: string
  href?: string
  /** 深色 logo（抖音）在暗色主题下反色，否则看不见 */
  invertOnDark?: boolean
}

export const SOCIAL_LINKS: SocialLink[] = [
  { label: '微信公众号', icon: wechatIcon },
  { label: '小红书', icon: xiaohongshuIcon },
  { label: '抖音', icon: tiktokIcon, invertOnDark: true },
]

/**
 * 「更多」菜单：按组渲染，组间用分隔线。
 * 第一组为规则条款，第二组为公司相关。
 */
export const MORE_LINK_GROUPS: SiteLink[][] = [
  [
    { label: '用户协议', to: 'terms' },
    { label: '隐私政策', to: 'privacy' },
    { label: '侵权投诉指引', to: 'infringement' },
    { label: '热点规则', to: 'hotspot-rules' },
    { label: '社区规范', to: 'community' },
  ],
  [
    { label: '关于我们', to: 'about' },
    { label: '加入我们', to: 'join-us' },
    { label: '联系客服', to: 'support' },
  ],
]

/** 主体信息。上线前替换为真实文案，为空的条目不展示。 */
export const COMPANY_NAME = '浙江微作智能科技有限公司'
export const COMPANY_ADDRESS = '浙江省杭州市萧山区盈丰街道民和路483号302室杭州市信息安全产业园1335室'

/** 备案号。为空则不展示。 */
export const ICP_RECORD = '浙ICP备XXXXX号'
export const ICP_QUERY_URL = 'https://beian.miit.gov.cn/'
/** 网信算法备案号 */
export const ALGORITHM_RECORD = '网信算备XXXXXX号'

/**
 * 登录弹窗顶部运营位。文案已画进图里，所以只留图片一项；
 * 换运营图直接替换这个 import 即可，出图按 1240×264（@2x）。
 * 二维码为空时展示占位块，接入后端后换成接口返回的一次性二维码。
 */
export const LOGIN_BANNER = {
  image: registerTitleImage,
}

export const LOGIN_QRCODE_URL = ''

/** 移动端入口。二维码图片放 public/ 后填路径，为空则展示占位块。 */
export const MOBILE_QRCODE_URL = ''
export const MOBILE_SITE_HINT = '微信扫码，随时随地逛次元公园'

/**
 * 微信小程序入口。H5 只提供浏览，点赞、评论等互动都引导到小程序里完成。
 * 填 URL Scheme（weixin://dl/business/?t=xxx）或云端返回的短链；
 * 为空时按钮仍然显示，点了给一句提示，避免上线前页面上凭空少一块。
 */
export const MINIPROGRAM_URL = ''
export const MINIPROGRAM_CTA = '打开微信小程序'
export const MINIPROGRAM_COMMENTS_CTA = '打开微信小程序查看更多评论'
/** URL 未配置时的兜底提示 */
export const MINIPROGRAM_FALLBACK_HINT = '请在微信中搜索「次元公园」小程序'
