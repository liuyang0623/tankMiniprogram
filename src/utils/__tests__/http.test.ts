import { describe, it, expect } from 'vitest'
import { isUnauthorized } from '../http'
import { ApiError } from '../../services/errors'

describe('isUnauthorized', () => {
  it('ApiError code=401 返回 true', () => {
    expect(isUnauthorized(new ApiError(401, '未登录', 401))).toBe(true)
  })
  it('ApiError code=500 返回 false', () => {
    expect(isUnauthorized(new ApiError(500, '服务器错误', 500))).toBe(false)
  })
  it('普通 Error 返回 false', () => {
    expect(isUnauthorized(new Error('boom'))).toBe(false)
  })
  it('null 返回 false', () => {
    expect(isUnauthorized(null)).toBe(false)
  })
  it('undefined 返回 false', () => {
    expect(isUnauthorized(undefined)).toBe(false)
  })
})
