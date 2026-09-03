import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

/*
 * 首页静态导入，其余页面按需加载。
 *
 * 首页是绝大多数访问的落地页，懒加载它只是把首屏多加一次往返，没有收益；
 * 「我的」「管理账号」这些要点进去才看得到，跟着首屏一起下载纯属浪费。
 *
 * 占位页共用下面这一个 loader 常量（而不是在 12 条路由里各写一遍 import）——
 * 各写一遍虽然打出来也是同一个 chunk，但把同一个函数引用传给所有路由更明确：
 * 它们本来就是同一个页面。
 */
const ProfileView = () => import('@/views/ProfileView.vue')
const AccountView = () => import('@/views/AccountView.vue')
const NotFoundView = () => import('@/views/NotFoundView.vue')
const PlaceholderView = () => import('@/views/PlaceholderView.vue')

/** 尚未实现的页面：统一走占位页，标题写在 meta 里。 */
const PLACEHOLDER_ROUTES: Array<{ path: string; name: string; title: string }> = [
  { path: '/explore', name: 'explore', title: '探索' },
  /* 没有 /create：创作台是独立子站，入口统一走 site.ts 的 CREATE_STATION_URL */
  { path: '/notifications', name: 'notifications', title: '消息' },
  { path: '/membership', name: 'membership', title: '会员中心' },
  // 「更多」菜单指向的信息页
  { path: '/about', name: 'about', title: '关于我们' },
  { path: '/terms', name: 'terms', title: '用户协议' },
  { path: '/privacy', name: 'privacy', title: '隐私政策' },
  { path: '/infringement', name: 'infringement', title: '侵权投诉指引' },
  { path: '/hotspot-rules', name: 'hotspot-rules', title: '热点规则' },
  { path: '/community', name: 'community', title: '社区规范' },
  { path: '/join-us', name: 'join-us', title: '加入我们' },
  { path: '/support', name: 'support', title: '联系客服' },
]

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    // title 用于页面内展示，documentTitle 覆盖浏览器标签页文案
    meta: { title: '首页', documentTitle: '次元公园丨acgnpark 等你来！' },
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { title: '我的' },
  },
  {
    path: '/account',
    name: 'account',
    component: AccountView,
    meta: { title: '管理账号' },
  },
  ...PLACEHOLDER_ROUTES.map<RouteRecordRaw>(({ path, name, title }) => ({
    path,
    name,
    component: PlaceholderView,
    meta: { title },
  })),
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: { title: '页面不存在' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // 切换路由回到顶部，浏览器前进后退时恢复原位置
  scrollBehavior: (_to, _from, savedPosition) => savedPosition ?? { top: 0 },
})

/**
 * 分包后取不到 chunk 时的兜底。
 *
 * 这是路由懒加载唯一的代价：用户开着页面时如果重新部署，旧 chunk 的文件名
 * 已经不在服务器上了，此时点导航会 404 —— 表现是点了没反应、画面停在原地，
 * 比多等一次往返糟糕得多。重载一次即可拿到新版本的文件名。
 */
const RELOAD_KEY = 'acgnpark:chunk-reloaded'

/** 各浏览器对「动态 import 失败」的措辞不同，三家都认一遍 */
const CHUNK_ERROR =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i

router.onError((error, to) => {
  if (!CHUNK_ERROR.test(error.message)) return

  // 记一次标记：真的坏了（断网、文件确实缺失）时只刷一次，不陷进反复重载
  try {
    if (sessionStorage.getItem(RELOAD_KEY)) return
    sessionStorage.setItem(RELOAD_KEY, '1')
  } catch {
    // 隐私模式下不可写，那就不重试，免得没有刹车
    return
  }

  window.location.assign(to.fullPath)
})

router.afterEach((to) => {
  const custom = to.meta.documentTitle as string | undefined
  const title = to.meta.title as string | undefined
  document.title = custom ?? (title ? `${title} · ACGNPark` : 'ACGNPark')

  // 走通一次就把标记清掉，下次部署仍能自动恢复
  try {
    sessionStorage.removeItem(RELOAD_KEY)
  } catch {
    // 读不到也就无所谓清不清
  }
})

export default router
