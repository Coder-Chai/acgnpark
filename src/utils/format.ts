/**
 * 手机号打码：保留前 3 位与后 4 位，中间 4 位用星号盖掉（138****1234）。
 * 展示层统一走这里，原始号码只留在表单和请求里 —— 地址列表这类会被人从背后看到的
 * 页面不该出现完整号码。
 * 位数不足 11 的（脏数据、境外号）原样返回，不做半吊子打码把号码弄乱。
 */
export function maskPhone(phone: string): string {
  if (!/^\d{11}$/.test(phone)) return phone
  return `${phone.slice(0, 3)}****${phone.slice(7)}`
}

/** 万 */
const TEN_THOUSAND = 10000
/** 亿 */
const HUNDRED_MILLION = 100000000

/**
 * 互动数的展示格式。中文站按「万/亿」分级，不用 k/w 这类缩写 ——
 * 卡片和详情弹窗是同一条内容的两个视图，共用这一个函数，
 * 否则一处 1.2k、一处 1.2w，同一个数字在两个地方长得不一样。
 *
 * 一万以内给原数；超过则保留一位小数，整数不拖 .0（12000 → 1.2万，20000 → 2万）。
 * 向下取整而非四舍五入：9999 不该显示成「1万」，那是把数字说大了。
 */
export function formatCount(value: number): string {
  if (value < TEN_THOUSAND) return String(value)

  const [unitValue, unit] =
    value < HUNDRED_MILLION ? [TEN_THOUSAND, '万'] : [HUNDRED_MILLION, '亿']
  const scaled = Math.floor((value / unitValue) * 10) / 10

  return `${scaled}${unit}`
}
