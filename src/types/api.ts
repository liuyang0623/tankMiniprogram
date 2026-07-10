// go-service /api/v1 接口契约类型
// 契约已核对 pkg/response（成功 code===200）与各 service response struct

export type PostStatus = 'DRAFT' | 'PUBLISHED'

/** 后端统一响应包裹：{ data, code, message }，成功 code===200 */
export interface ApiEnvelope<T> {
  data: T
  code: number
  message: string
}

export interface User {
  id: number
  nickname: string
  avatar: string
  bio: string
  gender: number
  phone?: string
}

/** 帖子作者精简信息（昵称 json tag 为 name） */
export interface PostAuthor {
  id: number
  name: string
  avatar: string
}

/** 帖子配图（排序 json tag 为 order） */
export interface PostImage {
  id: number
  url: string
  order: number
}

export interface Topic {
  id: number
  name: string
}

export interface Post {
  id: number
  title: string
  content: string
  cover?: string
  status: PostStatus
  authorId: number
  author: PostAuthor
  viewCount: number
  likeCount: number
  commentCount: number
  images?: PostImage[]
  topics?: Topic[]
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

export interface Comment {
  id: number
  content: string
  parentId?: number
  replies?: Comment[]
  createdAt?: string
}

/** 分页元信息 */
export interface PaginationMeta {
  total: number
  page: number
  limit: number
}

/** 分页返回：{ data: T[], meta } */
export interface Paginated<T> {
  data: T[]
  meta: PaginationMeta
}

/** 登录返回的用户精简信息 */
export interface LoginUser {
  id: number
  nickname: string
  avatar: string
}

export interface AuthResponse {
  token: string
  user: LoginUser
}
