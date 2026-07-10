import { authRequest } from '../authRequest'
import type { Post, Paginated } from '../../types/api'

export interface CreatePostBody {
  title: string
  content: string
  cover?: string
  topicIds?: number[]
  imageUrls?: string[]
}

export type UpdatePostBody = Partial<CreatePostBody>

export const postsApi = {
  /** 公开（可选鉴权）：帖子列表（分页）。带 token 时后端可返回个性化信息 */
  findAll: (page = 1, limit = 10) =>
    authRequest<Paginated<Post>>({ url: `/posts?page=${page}&limit=${limit}` }),
  /** 公开（可选鉴权）：帖子详情。带 token 时后端返回真实 isLiked/isFavorited */
  findOne: (id: number) => authRequest<Post>({ url: `/posts/${id}` }),
  /** 受保护：创建帖子 */
  create: (body: CreatePostBody) => authRequest<Post>({ url: '/posts', method: 'POST', data: body }),
  /** 受保护：更新帖子 */
  update: (id: number, body: UpdatePostBody) =>
    authRequest<Post>({ url: `/posts/${id}`, method: 'PATCH', data: body }),
  /** 受保护：删除帖子 */
  remove: (id: number) => authRequest<void>({ url: `/posts/${id}`, method: 'DELETE' }),
  /** 受保护：发布帖子 */
  publish: (id: number) => authRequest<Post>({ url: `/posts/${id}/publish`, method: 'POST' }),
  /** 受保护：我的草稿 */
  findDrafts: (page = 1) => authRequest<Paginated<Post>>({ url: `/posts/drafts?page=${page}` }),
  /** 受保护：我的帖子 */
  findMyPosts: (page = 1) => authRequest<Paginated<Post>>({ url: `/posts/my?page=${page}` }),
}
