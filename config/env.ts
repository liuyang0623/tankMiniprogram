// 后端环境配置：按编译期 TARO_APP_ENV 切换 baseURL
// dev 默认指向本地 go-service；上线时改 prod 域名或注入 TARO_APP_ENV
const ENV = process.env.TARO_APP_ENV || 'dev'

const MAP: Record<string, string> = {
  dev: 'http://localhost:3000/api/v1',
  prod: 'https://api.example.com/api/v1', // TODO: 上线时替换为真实域名
}

export const BASE_URL = MAP[ENV] ?? MAP.dev
