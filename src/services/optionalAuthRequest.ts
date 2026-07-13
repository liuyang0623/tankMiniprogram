import { request, type RequestOptions } from './request'
import { useAuthStore } from '../store/auth'

/**
 * 可选鉴权请求：登录时注入 token 以个性化返回（如 isFollowing），
 * 未登录时不带 token 也能正常访问。用于后端 OptionalJWT 路由。
 * 与 authRequest 的区别：不在 401 时清登录态（OptionalJWT 路由不返回 401）。
 */
export function optionalAuthRequest<T = any>(
  opts: Omit<RequestOptions, 'token' | 'onUnauthorized'>,
): Promise<T> {
  const { token } = useAuthStore.getState()
  return request<T>({ ...opts, token })
}
