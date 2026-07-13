import { usersApi } from '../../services/api/users'
import type { Paginated, FollowUserItem } from '../../types/api'

export type FollowListType = 'followers' | 'following'

/** 规范化列表类型参数，非法值缺省为 followers */
export function normalizeFollowListType(raw?: string): FollowListType {
  return raw === 'following' ? 'following' : 'followers'
}

/** 列表页标题 */
export function followListTitle(type: FollowListType): string {
  return type === 'following' ? '关注' : '粉丝'
}

/** 根据类型选择数据源 */
export function pickFollowFetcher(
  type: FollowListType,
  userId: number,
): (page: number) => Promise<Paginated<FollowUserItem>> {
  return type === 'following'
    ? (page) => usersApi.getFollowing(userId, page)
    : (page) => usersApi.getFollowers(userId, page)
}
