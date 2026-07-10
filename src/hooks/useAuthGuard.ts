import { useAuthStore } from '../store/auth'
import { useUiStore } from '../store/ui'
import { login } from '../services/auth'

/**
 * 登录守卫：受保护操作前调用。
 * 已登录直接执行；未登录则先拉起微信登录，成功后执行。
 */
export function useAuthGuard() {
  return async (action: () => void | Promise<void>) => {
    if (useAuthStore.getState().isLogin) {
      return action()
    }
    try {
      await login()
      await action()
    } catch (e: any) {
      useUiStore.getState().showToast(e?.message || '请先登录', 'error')
    }
  }
}
