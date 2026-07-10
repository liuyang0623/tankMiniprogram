import { request } from '../request'
import { authRequest } from '../authRequest'
import type { Comment, Post, Paginated } from '../../types/api'

export interface CreateCommentBody {
  postId: number
  content: string
  parentId?: number
}

export const interactionsApi = {
  /** 公开：帖子评论列表 */
  getComments: (postId: number) => request<Comment[]>({ url: `/posts/${postId}/comments` }),
  /** 受保护：点赞 */
  likePost: (id: number) => authRequest<void>({ url: `/posts/${id}/like`, method: 'POST' }),
  /** 受保护：收藏 */
  favoritePost: (id: number) => authRequest<void>({ url: `/posts/${id}/favorite`, method: 'POST' }),
  /** 受保护：我的收藏 */
  getFavorites: () => authRequest<Paginated<Post>>({ url: '/users/me/favorites' }),
  /** 受保护：发表评论 */
  createComment: (body: CreateCommentBody) =>
    authRequest<Comment>({ url: '/comments', method: 'POST', data: body }),
  /** 受保护：删除评论 */
  deleteComment: (id: number) => authRequest<void>({ url: `/comments/${id}`, method: 'DELETE' }),
}
