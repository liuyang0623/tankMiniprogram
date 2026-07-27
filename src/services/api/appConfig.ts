import { optionalAuthRequest } from '../optionalAuthRequest'

/** 全局应用配置。auditMode=true 表示审核模式（隐藏部分互动板块）。 */
export interface AppConfig {
  auditMode: boolean
}

/** 应用配置（免鉴权，启动阶段调用；后端 OptionalJWT 路由） */
export const appConfigApi = {
  /** 获取全局应用配置 */
  get: () => optionalAuthRequest<AppConfig>({ url: '/app-config' }),
}
