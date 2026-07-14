import { authRequest } from '../authRequest'
import type { Post, Paginated, PostStatus, CategoryInfo } from '../../types/api'

export interface CreatePostBody {
  title: string
  content: string // 富文本 HTML
  cover?: string // 正文首图
  status?: PostStatus // DRAFT(默认) | PUBLISHED
  category?: string // 分类（story/daily/tech/food/travel），空=其他
  images?: string[] // 图片 URL 数组，对齐后端 images
  topics?: string[] // 话题名数组，对齐后端 topics（非 id）
}

export type UpdatePostBody = Partial<CreatePostBody>

/** 首页列表查询参数 */
export interface FindPostsParams {
  page?: number
  limit?: number
  keyword?: string // 按 title 搜索
  category?: string // 分类过滤；'none' = 无分类
  sort?: string // 'likes' = 推荐排序
  following?: boolean // 关注流
}

function buildPostsQuery(params: FindPostsParams): string {
  const q: string[] = []
  q.push(`page=${params.page ?? 1}`)
  q.push(`limit=${params.limit ?? 10}`)
  if (params.keyword) q.push(`keyword=${encodeURIComponent(params.keyword)}`)
  if (params.category) q.push(`category=${encodeURIComponent(params.category)}`)
  if (params.sort) q.push(`sort=${params.sort}`)
  if (params.following) q.push('following=true')
  return q.join('&')
}

export const postsApi = {
  /** 公开（可选鉴权）：帖子列表（分页 + 搜索/分类/排序/关注筛选） */
  findAll: (params: FindPostsParams = {}) =>
    authRequest<Paginated<Post>>({ url: `/posts?${buildPostsQuery(params)}` }),
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

export const categoriesApi = {
  /** 公开：固定分类列表 */
  list: () => authRequest<CategoryInfo[]>({ url: '/categories' }),
}
