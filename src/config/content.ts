/**
 * 内容假数据。列表项与详情共用一套素材：两者由同一个 id 推导，
 * 分开写迟早会出现卡片上 12 条评论、点开只有 3 条的情况。
 *
 * TODO: 接口就绪后整个文件删除，改为按 tabKey 拉列表、按 id 拉详情。
 */
import type { ContentComment, ContentDetail, ContentItem } from '@/types/content'

/* 长短掺着放：短的两三个字、长的能折两三行，好一次看出标题区在两种极端下的样子 */
const MOCK_TITLES = [
  '雨后的电车站台，末班车开走以后整条街只剩下积水在反光',
  '深海观测站',
  '赛博茶室｜霓虹与蒸汽之间，老板娘泡了三十年的茶',
  '春日校园写生：从操场东侧的樱花树画到图书馆背后的坡道，一共花了四个下午',
  '机械之心',
  '午后的猫与书',
  '霓虹街角',
  '云上列车穿过第七片积雨云的那一刻，窗外的光忽然变成了橘色',
  '古镇灯会',
  '星轨下的少女',
  '废墟花园',
  '晨雾山谷',
  '夏日祭典的最后一发烟花，和那年没说出口的一句话',
  '未来图书馆',
  '雪国旅人',
  '琉璃庭院',
]

const MOCK_AUTHORS = ['星野绘', 'Kuro', '青柠', '半糖', 'Rin', '墨白', '拾光', 'Yuki']
const MOCK_RATIOS = [0.75, 1, 1.33, 0.8, 1.5, 0.67]

/**
 * 「零互动」的新贴：列表与详情都按 id 后缀判断，
 * 两处共用这一个函数，免得各写一遍导致卡片和弹窗的数字对不上。
 * TODO: 与整段假数据一并删除。
 */
function isCold(seed: number) {
  return seed % 5 === 0
}

export function createMockFeed(tabKey: string, count = 24): ContentItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${tabKey}-${i}`,
    title: MOCK_TITLES[(i * 3 + tabKey.length) % MOCK_TITLES.length] ?? '未命名',
    author: MOCK_AUTHORS[(i + tabKey.length) % MOCK_AUTHORS.length] ?? '匿名',
    /* 上限拉到 6 万，好看到过万后「X.X万」的样子 */
    likes: isCold(i) ? 0 : ((i * 4637 + tabKey.length * 29) % 59000) + 12,
    ratio: MOCK_RATIOS[(i + tabKey.length) % MOCK_RATIOS.length] ?? 1,
    cover: `https://picsum.photos/seed/${tabKey}-${i}/600/800`,
  }))
}

/** 详情假数据素材。接口就绪后这一段与 createMockDetail 一并删除。 */
/* 同样长短掺着：一句话的、和能撑满一屏要滚动的，用来验证正文与评论区的衔接 */
const MOCK_DESCS = [
  '随手记录的一个瞬间，光刚好落在这里。',
  '这版一共调了三次色。第一次偏冷，整体像蒙了一层灰，看久了人物的皮肤会发青；第二次把饱和度拉高，结果背景的霓虹把主体吃掉了，远看只剩一团颜色。最后还是回到最开始的方案，只把高光的位置往左挪了一点，让视线先落在伞面上，再顺着雨丝下来。\n\n背景的建筑是照着回家路上那条街改的，招牌上的字都换成了看不出含义的形状——写实的字会让人去读，读了就出戏。',
  '模型用的是社区里那款，参数写在评论区了。放大看细节会有点糊，这版没做超分，等有空重跑一遍再更新。',
  '本来只想画个草稿。起稿的时候只想定一下构图，画着画着觉得光可以再往里走一点，于是把窗户挪到了画面右侧；挪完发现原来的人物姿势撑不住这个光，又重画了一遍手臂。等抬头看时间已经凌晨三点了。\n\n第二张是过程图，第三张是最开始那版草稿，能看出差得挺远。有想问的可以评论区问，参数和笔刷我都放在简介里了。',
]

const MOCK_TAGS = [
  ['插画', '原创'],
  ['赛博朋克', '场景设计', 'AI绘画'],
  ['角色设计', '二次元'],
  ['风景', '治愈系'],
]

const MOCK_REGIONS = ['广东', '浙江', '北京', '上海', '四川']

const MOCK_COMMENT_TEXTS = [
  '这个氛围感太好了，能出个教程吗',
  '收藏了，周末照着练一张',
  '参数能分享一下吗？',
  '第二张我最喜欢',
  '一眼就认出是你的风格',
  '构图学到了',
]

const MOCK_REPLY_TEXTS = ['谢谢！', '参数放在简介里了', '好，回头整理一下发出来', '+1 想看教程']

/**
 * 按列表项造一份详情。
 * 同一个 id 每次调用结果一致（全部取模于 id 的数字后缀），
 * 否则弹窗每次打开评论都在变，看着像数据错乱。
 */
export function createMockDetail(item: ContentItem): ContentDetail {
  const seed = Number(item.id.split('-').pop()) || 0
  const imageCount = (seed % 4) + 1
  const cold = isCold(seed)

  const comments: ContentComment[] = Array.from({ length: cold ? 0 : (seed % 6) + 3 }, (_, i) => {
    const k = seed + i
    const replies: ContentComment[] =
      i % 2 === 0
        ? [
            {
              id: `${item.id}-c${i}-r0`,
              author: i === 0 ? item.author : (MOCK_AUTHORS[(k + 3) % MOCK_AUTHORS.length] ?? '匿名'),
              text: MOCK_REPLY_TEXTS[k % MOCK_REPLY_TEXTS.length] ?? '',
              date: `07-${String((k % 20) + 9).padStart(2, '0')}`,
              region: MOCK_REGIONS[k % MOCK_REGIONS.length],
              likes: k % 7,
              isAuthor: i === 0,
            },
          ]
        : []

    return {
      id: `${item.id}-c${i}`,
      author: MOCK_AUTHORS[k % MOCK_AUTHORS.length] ?? '匿名',
      text: MOCK_COMMENT_TEXTS[k % MOCK_COMMENT_TEXTS.length] ?? '',
      date: `07-${String((k % 20) + 8).padStart(2, '0')}`,
      region: MOCK_REGIONS[(k + 1) % MOCK_REGIONS.length],
      likes: (k * 3) % 40,
      replies,
    }
  })

  return {
    /* 点赞数直接沿用列表项：详情不再自己算一份，否则点赞后两处会分叉 */
    ...item,
    images: Array.from(
      { length: imageCount },
      (_, i) => `https://picsum.photos/seed/${item.id}-${i}/900/1200`,
    ),
    desc: MOCK_DESCS[seed % MOCK_DESCS.length],
    tags: MOCK_TAGS[seed % MOCK_TAGS.length],
    date: `编辑于 07-${String((seed % 25) + 4).padStart(2, '0')}`,
    collects: cold ? 0 : (seed * 4231) % 42000,
    comments,
    commentCount: cold ? 0 : (seed * 53) % 1600,
  }
}
