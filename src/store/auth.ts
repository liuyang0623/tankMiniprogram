import { create } from 'zustand'
import Taro from '@tarojs/taro'
import type { LoginUser } from '../types/api'

const TOKEN_KEY = 'blr_token'
const USER_KEY = 'blr_user'

interface AuthState {
  token: string
  user: LoginUser | null
  isLogin: boolean
  /** 登录成功：写入内存态 + 持久化 */
  setAuth: (token: string, user: LoginUser) => void
  /** 清除登录态（登出 / 401 失效） */
  clear: () => void
  /** 启动时从本地存储恢复 */
  restore: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: '',
  user: null,
  isLogin: false,

  setAuth: (token, user) => {
    Taro.setStorageSync(TOKEN_KEY, token)
    Taro.setStorageSync(USER_KEY, user)
    set({ token, user, isLogin: true })
    // 登录后建立 WebSocket 连接
    import('../store/ws').then(({ useWsStore }) => useWsStore.getState().connect())
  },

  clear: () => {
    Taro.removeStorageSync(TOKEN_KEY)
    Taro.removeStorageSync(USER_KEY)
    set({ token: '', user: null, isLogin: false })
    // 登出时断开 WebSocket
    import('../store/ws').then(({ useWsStore }) => useWsStore.getState().disconnect())
    import('./message').then(({ useMessageStore }) => useMessageStore.getState().reset())
    import('./notification').then(({ useNotificationStore }) => useNotificationStore.getState().reset())
  },

  restore: () => {
    const token = Taro.getStorageSync(TOKEN_KEY)
    const user = Taro.getStorageSync(USER_KEY)
    if (token) {
      set({ token, user: user || null, isLogin: true })
      // 从持久化恢复后也建立 WS 连接
      import('../store/ws').then(({ useWsStore }) => useWsStore.getState().connect())
    }
  },
}))
