import { request, type RequestOptions } from './request'
import { useAuthStore } from '../store/auth'

/**
 * 受保护请求：自动从 authStore 注入 token，401 时清登录态。
 * 供需要鉴权的 API 方法使用。
 */
export function authRequest<T = any>(opts: Omit<RequestOptions, 'token' | 'onUnauthorized'>): Promise<T> {
  const { token } = useAuthStore.getState()
  return request<T>({
    ...opts,
    token,
    onUnauthorized: () => useAuthStore.getState().clear(),
  })
}
