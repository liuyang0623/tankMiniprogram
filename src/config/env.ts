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
