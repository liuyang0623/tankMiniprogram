import { request } from '../request'
import type { AuthResponse } from '../../types/api'

export interface WechatLoginParams {
  code: string
  nickName?: string
  avatarUrl?: string
}

export const authApi = {
  /** 微信 code 换 JWT（公开接口） */
  wechatLogin: (params: WechatLoginParams) =>
    request<AuthResponse>({ url: '/auth/wechat/login', method: 'POST', data: params }),
}
