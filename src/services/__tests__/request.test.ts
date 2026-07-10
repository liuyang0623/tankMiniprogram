import { describe, it, expect, vi, beforeEach } from 'vitest'

// mock Taro.request
vi.mock('@tarojs/taro', () => ({
  default: { request: vi.fn() },
}))

import Taro from '@tarojs/taro'
import { request } from '../request'
import { ApiError } from '../errors'

const mockRequest = Taro.request as unknown as ReturnType<typeof vi.fn>

describe('request', () => {
  beforeEach(() => vi.clearAllMocks())

  it('成功时解包 data（code===200）', async () => {
    mockRequest.mockResolvedValue({ statusCode: 200, data: { code: 200, data: { id: 1 }, message: 'success' } })
    await expect(request({ url: '/posts/1' })).resolves.toEqual({ id: 1 })
  })

  it('业务 code 非 200 抛 ApiError', async () => {
    mockRequest.mockResolvedValue({ statusCode: 200, data: { code: 1001, data: null, message: '失败' } })
    await expect(request({ url: '/x' })).rejects.toBeInstanceOf(ApiError)
  })

  it('注入 Authorization 头', async () => {
    mockRequest.mockResolvedValue({ statusCode: 200, data: { code: 200, data: {}, message: 'ok' } })
    await request({ url: '/me', token: 'tk' })
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        header: expect.objectContaining({ Authorization: 'Bearer tk' }),
      }),
    )
  })

  it('无 token 时不注入 Authorization', async () => {
    mockRequest.mockResolvedValue({ statusCode: 200, data: { code: 200, data: {}, message: 'ok' } })
    await request({ url: '/posts' })
    const arg = mockRequest.mock.calls[0][0]
    expect(arg.header.Authorization).toBeUndefined()
  })

  it('401 触发 onUnauthorized 并抛 ApiError', async () => {
    const onUnauthorized = vi.fn()
    mockRequest.mockResolvedValue({ statusCode: 401, data: {} })
    await expect(request({ url: '/me', onUnauthorized })).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('网络失败包装为 ApiError（code 0）', async () => {
    mockRequest.mockRejectedValue(new Error('request:fail timeout'))
    await expect(request({ url: '/posts' })).rejects.toBeInstanceOf(ApiError)
    await expect(request({ url: '/posts' })).rejects.toMatchObject({ code: 0 })
  })
})
