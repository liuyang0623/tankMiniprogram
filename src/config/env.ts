// 后端环境配置：baseURL 按编译期常量 TARO_APP_ENV 切换。
// 注意：小程序运行时没有 Node 的 process 全局。Taro defineConstants 会在编译期
// 把 process.env.TARO_APP_ENV 整体替换为字面量字符串（如 "dev"），因此运行时
// 不会真正读取 process 对象。
const ENV: string = process.env.TARO_APP_ENV || 'dev'

const MAP: Record<string, string> = {
  dev: 'http://localhost:3000/api/v1',
  prod: 'https://api.example.com/api/v1', // TODO: 上线时替换为真实域名
}

export const BASE_URL = MAP[ENV] ?? MAP.dev

// 微信订阅消息模板 ID：「被关注通知」。用于 wx.requestSubscribeMessage 拉起授权，
// 需与后端 WECHAT_SUBSCRIBE_TPL_FOLLOW 保持一致。
export const SUBSCRIBE_TPL_FOLLOW = 'Q2BcepkCFvBshhtriPZlJVWA471xoYkoyJ7xDS4T_BA'
