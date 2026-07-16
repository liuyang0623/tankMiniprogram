import { request, type RequestOptions } from './request'
import { useAuthStore } from '../store/auth'
import { useUiStore } from '../store/ui'

/**
 * 受保护请求：自动从 authStore 注入 token，401 时统一清登录态 + 全局提示引导重登。
 * 401 处理收敛在此，调用方无需各自传 onUnauthorized。
 * showToast 内部有去重计时，并发 401 只呈现一条提示；已登出则跳过，避免重复提示。
 */
export function authRequest<T = any>(opts: Omit<RequestOptions, 'token' | 'onUnauthorized'>): Promise<T> {
  const { token } = useAuthStore.getState()
  return request<T>({
    ...opts,
    token,
    onUnauthorized: () => {
      if (!useAuthStore.getState().isLogin) return
      useAuthStore.getState().clear()
      useUiStore.getState().showToast('登录已失效，请重新登录', 'error')
    },
  })
}
