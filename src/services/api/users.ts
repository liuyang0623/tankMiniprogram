import { request } from '../request'
import { authRequest } from '../authRequest'
import type { User, Post, Paginated } from '../../types/api'

export interface UpdateProfileBody {
  nickname?: string
  avatar?: string
  bio?: string
  gender?: number
}

export const usersApi = {
  /** 公开：按 id 查看用户 */
  getUser: (id: number) => request<User>({ url: `/users/${id}` }),
  /** 受保护：当前登录用户资料 */
  getProfile: () => authRequest<User>({ url: '/users/profile' }),
  /** 受保护：更新资料 */
  updateProfile: (body: UpdateProfileBody) =>
    authRequest<User>({ url: '/users/profile', method: 'PATCH', data: body }),
  /** 公开：某用户的帖子 */
  getUserPosts: (id: number, page = 1) =>
    request<Paginated<Post>>({ url: `/users/${id}/posts?page=${page}` }),
}
