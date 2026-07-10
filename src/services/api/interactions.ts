import { request } from '../request'
import { authRequest } from '../authRequest'
import type { Comment, Post, Paginated, PaginatedComments } from '../../types/api'

export interface CreateCommentBody {
  postId: number
  content: string
  parentId?: number
}

export const interactionsApi = {
  /** 公开：帖子评论列表（分页） */
  getComments: (postId: number, page = 1) =>
    request<PaginatedComments>({ url: `/posts/${postId}/comments?page=${page}` }),
  /** 受保护：点赞（toggle，返回当前状态） */
  likePost: (id: number) => authRequest<{ liked: boolean }>({ url: `/posts/${id}/like`, method: 'POST' }),
  /** 受保护：收藏（toggle，返回当前状态） */
  favoritePost: (id: number) =>
    authRequest<{ favorited: boolean }>({ url: `/posts/${id}/favorite`, method: 'POST' }),
  /** 受保护：我的收藏 */
  getFavorites: () => authRequest<Paginated<Post>>({ url: '/users/me/favorites' }),
  /** 受保护：发表评论 */
  createComment: (body: CreateCommentBody) =>
    authRequest<Comment>({ url: '/comments', method: 'POST', data: body }),
  /** 受保护：删除评论 */
  deleteComment: (id: number) => authRequest<void>({ url: `/comments/${id}`, method: 'DELETE' }),
  /**
   * 受保护：评论点赞（toggle）。
   * 后端暂无该接口，预留占位；就绪后替换为真实 authRequest 调用即可，UI 无需改动。
   */
  likeComment: (_id: number) => Promise.resolve<{ liked: boolean }>({ liked: true }),
}
