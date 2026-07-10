import Taro from '@tarojs/taro'
import { authApi } from './api/auth'
import { useAuthStore } from '../store/auth'

/**
 * 微信登录：wx.login 取 code → 换 JWT → 写入登录态。
 * @param profile 可选的微信头像昵称（用户授权后传入）
 */
export async function login(profile?: { nickName?: string; avatarUrl?: string }): Promise<void> {
  const { code } = await Taro.login()
  if (!code) throw new Error('微信登录失败：未获取到 code')
  const res = await authApi.wechatLogin({ code, ...profile })
  const { token, user } = res
  useAuthStore.getState().setAuth(token, user)
}

/** 登出 */
export function logout(): void {
  useAuthStore.getState().clear()
}
