import { request } from '../request'
import { authRequest } from '../authRequest'
import { optionalAuthRequest } from '../optionalAuthRequest'
import type { User, Post, Paginated, FollowUserItem } from '../../types/api'

export interface UpdateProfileBody {
  nickname?: string
  avatar?: string
  bio?: string
  gender?: number
}

export const usersApi = {
  /** 公开（可选鉴权）：按 id 查看用户，登录时带回 isFollowing */
  getUser: (id: number) => optionalAuthRequest<User>({ url: `/users/${id}` }),
  /** 受保护：当前登录用户资料 */
  getProfile: () => authRequest<User>({ url: '/users/profile' }),
  /** 受保护：更新资料 */
  updateProfile: (body: UpdateProfileBody) =>
    authRequest<User>({ url: '/users/profile', method: 'PATCH', data: body }),
  /** 公开：某用户的帖子 */
  getUserPosts: (id: number, page = 1) =>
    request<Paginated<Post>>({ url: `/users/${id}/posts?page=${page}` }),
  /** 受保护：关注/取关目标用户，返回关注后的状态 */
  toggleFollow: (id: number) =>
    authRequest<{ following: boolean }>({ url: `/users/${id}/follow`, method: 'POST' }),
  /** 公开（可选鉴权）：某用户的粉丝列表 */
  getFollowers: (id: number, page = 1) =>
    optionalAuthRequest<Paginated<FollowUserItem>>({ url: `/users/${id}/followers?page=${page}` }),
  /** 公开（可选鉴权）：某用户的关注列表 */
  getFollowing: (id: number, page = 1) =>
    optionalAuthRequest<Paginated<FollowUserItem>>({ url: `/users/${id}/following?page=${page}` }),
  /** 受保护：上报关注订阅授权，累加可推送配额 */
  reportSubscribeFollow: () =>
    authRequest<{ ok: boolean }>({ url: '/users/subscribe/follow', method: 'POST' }),
}
