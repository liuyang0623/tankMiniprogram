import { describe, it, expect, vi, beforeEach } from 'vitest'

// mock Taro 存储
const storage: Record<string, any> = {}
vi.mock('@tarojs/taro', () => ({
  default: {
    setStorageSync: (k: string, v: any) => {
      storage[k] = v
    },
    getStorageSync: (k: string) => storage[k],
    removeStorageSync: (k: string) => {
      delete storage[k]
    },
  },
}))

import { useAuthStore } from '../auth'

const mockUser = { id: 1, nickname: 'a', avatar: '', bio: '', gender: 0 }

describe('authStore', () => {
  beforeEach(() => {
    for (const k in storage) delete storage[k]
    useAuthStore.getState().clear()
  })

  it('setAuth 写入登录态并持久化', () => {
    useAuthStore.getState().setAuth('tk', mockUser)
    expect(useAuthStore.getState().isLogin).toBe(true)
    expect(useAuthStore.getState().token).toBe('tk')
    expect(storage['blr_token']).toBe('tk')
  })

  it('restore 从存储恢复登录态', () => {
    useAuthStore.getState().setAuth('tk2', mockUser)
    // 模拟重启：内存态清空但存储仍在
    useAuthStore.setState({ token: '', user: null, isLogin: false })
    useAuthStore.getState().restore()
    expect(useAuthStore.getState().token).toBe('tk2')
    expect(useAuthStore.getState().isLogin).toBe(true)
  })

  it('clear 清空登录态与存储', () => {
    useAuthStore.getState().setAuth('tk', mockUser)
    useAuthStore.getState().clear()
    expect(useAuthStore.getState().isLogin).toBe(false)
    expect(useAuthStore.getState().token).toBe('')
    expect(storage['blr_token']).toBeUndefined()
  })
})
