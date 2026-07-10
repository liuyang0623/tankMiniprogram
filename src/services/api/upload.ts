import Taro from '@tarojs/taro'
import { BASE_URL } from '../../../config/env'
import { useAuthStore } from '../../store/auth'
import { ApiError } from '../errors'

/** 上传单个文件到指定端点，复用 JWT 与统一解包 */
async function upload<T = { url: string }>(endpoint: string, filePath: string, name = 'file'): Promise<T> {
  const { token } = useAuthStore.getState()
  const res = await Taro.uploadFile({
    url: BASE_URL + endpoint,
    filePath,
    name,
    header: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (res.statusCode === 401) {
    useAuthStore.getState().clear()
    throw new ApiError(401, '未登录或登录已失效', 401)
  }

  let body: any
  try {
    body = JSON.parse(res.data)
  } catch {
    throw new ApiError(res.statusCode, '上传响应解析失败', res.statusCode)
  }

  if (res.statusCode >= 200 && res.statusCode < 300 && (body.code === 200 || body.code === undefined)) {
    return (body.data ?? body) as T
  }
  throw new ApiError(body?.code ?? res.statusCode, body?.message || '上传失败', res.statusCode)
}

export const uploadApi = {
  /** 受保护：上传图片 */
  uploadImage: (filePath: string) => upload<{ url: string }>('/upload/image', filePath),
  /** 受保护：上传文件 */
  uploadFile: (filePath: string) => upload<{ url: string }>('/upload/file', filePath),
}
