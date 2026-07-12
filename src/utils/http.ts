import { ApiError } from '../services/errors'

/** 判断错误是否为登录过期（401） */
export function isUnauthorized(err: unknown): boolean {
  return err instanceof ApiError && err.code === 401
}
