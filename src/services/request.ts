import Taro from '@tarojs/taro'
import { BASE_URL } from '../config/env'
import { ApiError } from './errors'

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'

export interface RequestOptions {
  url: string
  method?: Method
  data?: Record<string, any>
  /** JWT，存在则注入 Authorization 头 */
  token?: string
  /** 401 回调（清登录态、引导重登） */
  onUnauthorized?: () => void
}

/**
 * 统一 HTTP 客户端：拼接 baseURL、注入 JWT、解包统一响应、规范化错误。
 * 后端成功响应形如 { code: 200, data, message }，成功返回 data。
 */
export async function request<T = any>(opts: RequestOptions): Promise<T> {
  const header: Record<string, string> = { 'Content-Type': 'application/json' }
  if (opts.token) header['Authorization'] = `Bearer ${opts.token}`

  const res = await Taro.request({
    url: BASE_URL + opts.url,
    method: (opts.method || 'GET') as any,
    data: opts.data,
    header,
  })

  if (res.statusCode === 401) {
    opts.onUnauthorized?.()
    throw new ApiError(401, '未登录或登录已失效', 401)
  }

  const body: any = res.data
  const ok = res.statusCode >= 200 && res.statusCode < 300 && body && (body.code === 200 || body.code === undefined)
  if (ok) {
    return (body.data ?? body) as T
  }

  throw new ApiError(body?.code ?? res.statusCode, body?.message || '请求失败', res.statusCode)
}
