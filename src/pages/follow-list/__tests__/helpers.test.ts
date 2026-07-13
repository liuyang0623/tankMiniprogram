import { describe, it, expect, vi } from 'vitest'

const getFollowersMock = vi.fn()
const getFollowingMock = vi.fn()
vi.mock('../../../services/api/users', () => ({
  usersApi: {
    getFollowers: (id: number, page: number) => getFollowersMock(id, page),
    getFollowing: (id: number, page: number) => getFollowingMock(id, page),
  },
}))

import { normalizeFollowListType, followListTitle, pickFollowFetcher } from '../helpers'

describe('follow-list helpers', () => {
  it('normalizeFollowListType: following 原样，其它缺省 followers', () => {
    expect(normalizeFollowListType('following')).toBe('following')
    expect(normalizeFollowListType('followers')).toBe('followers')
    expect(normalizeFollowListType(undefined)).toBe('followers')
    expect(normalizeFollowListType('garbage')).toBe('followers')
  })

  it('followListTitle: 关注/粉丝', () => {
    expect(followListTitle('following')).toBe('关注')
    expect(followListTitle('followers')).toBe('粉丝')
  })

  it('pickFollowFetcher: following 走 getFollowing', () => {
    getFollowingMock.mockReset()
    const fetcher = pickFollowFetcher('following', 3)
    fetcher(2)
    expect(getFollowingMock).toHaveBeenCalledWith(3, 2)
  })

  it('pickFollowFetcher: followers 走 getFollowers', () => {
    getFollowersMock.mockReset()
    const fetcher = pickFollowFetcher('followers', 5)
    fetcher(1)
    expect(getFollowersMock).toHaveBeenCalledWith(5, 1)
  })
})
