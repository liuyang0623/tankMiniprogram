import { describe, it, expect, vi, beforeEach } from 'vitest'

// mock 底层 request：捕获传入的 onUnauthorized 回调以直接触发
const requestMock = vi.fn()
vi.mock('../request', () => ({
  request: (opts: any) => requestMock(opts),
}))

// mock auth / ui store：只关心 isLogin / clear / showToast 的调用编排
const clear = vi.fn()
let isLogin = true
vi.mock('../../store/auth', () => ({
  useAuthStore: { getState: () => ({ token: 'tk', isLogin, clear }) },
}))
const showToast = vi.fn()
vi.mock('../../store/ui', () => ({
  useUiStore: { getState: () => ({ showToast }) },
}))

import { authRequest } from '../authRequest'

/** 取出 authRequest 传给底层 request 的 onUnauthorized 回调 */
function captureOnUnauthorized() {
  authRequest({ url: '/notebooks' })
  return requestMock.mock.calls[0][0].onUnauthorized as () => void
}

describe('authRequest 401 统一处理', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isLogin = true
  })

  it('注入 token 并传入 onUnauthorized', () => {
    authRequest({ url: '/notebooks' })
    const opts = requestMock.mock.calls[0][0]
    expect(opts.token).toBe('tk')
    expect(typeof opts.onUnauthorized).toBe('function')
  })

  it('已登录时 401 触发 clear + toast 引导', () => {
    const onUnauthorized = captureOnUnauthorized()
    onUnauthorized()
    expect(clear).toHaveBeenCalledOnce()
    expect(showToast).toHaveBeenCalledWith('登录已失效，请重新登录', 'error')
  })

  it('已登出时 401 跳过，不重复 clear/提示', () => {
    isLogin = false
    const onUnauthorized = captureOnUnauthorized()
    onUnauthorized()
    expect(clear).not.toHaveBeenCalled()
    expect(showToast).not.toHaveBeenCalled()
  })
})
