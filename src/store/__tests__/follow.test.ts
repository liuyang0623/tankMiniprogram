import { describe, it, expect, vi, beforeEach } from 'vitest'

// mock Taro（Toast 等）
vi.mock('@tarojs/taro', () => ({
  default: {
    showToast: vi.fn(),
  },
}))

// mock usersApi.toggleFollow
const toggleFollowMock = vi.fn()
vi.mock('../../services/api/users', () => ({
  usersApi: {
    toggleFollow: (id: number) => toggleFollowMock(id),
  },
}))

// mock login + authStore（未登录拦截）
const loginMock = vi.fn()
vi.mock('../../services/auth', () => ({
  login: () => loginMock(),
}))

let isLoginState = true
let selfIdState: number | undefined = 1
vi.mock('../auth', () => ({
  useAuthStore: {
    getState: () => ({ isLogin: isLoginState, user: selfIdState != null ? { id: selfIdState } : null }),
  },
}))

import { useFollowStore } from '../follow'

describe('followStore', () => {
  beforeEach(() => {
    toggleFollowMock.mockReset()
    loginMock.mockReset()
    isLoginState = true
    selfIdState = 1
    // 重置 store
    useFollowStore.setState({ followingMap: {}, countsMap: {} })
  })

  it('hydrateUser 写入关注状态与计数', () => {
    useFollowStore.getState().hydrateUser(2, {
      isFollowing: true,
      followerCount: 10,
      followingCount: 5,
      likeCount: 3,
    })
    expect(useFollowStore.getState().isFollowing(2)).toBe(true)
    expect(useFollowStore.getState().countsMap[2]).toEqual({
      followerCount: 10,
      followingCount: 5,
      likeCount: 3,
    })
  })

  it('isFollowing 对未知用户返回 false', () => {
    expect(useFollowStore.getState().isFollowing(999)).toBe(false)
  })

  it('关注：乐观更新 isFollowing=true 且粉丝 +1', async () => {
    useFollowStore.getState().hydrateUser(2, { isFollowing: false, followerCount: 10, followingCount: 0 })
    toggleFollowMock.mockResolvedValue({ following: true })

    await useFollowStore.getState().toggle(2)

    expect(useFollowStore.getState().isFollowing(2)).toBe(true)
    expect(useFollowStore.getState().countsMap[2].followerCount).toBe(11)
    expect(toggleFollowMock).toHaveBeenCalledWith(2)
  })

  it('关注：当前用户自己的 followingCount +1', async () => {
    // 当前用户 selfId=1 已有关注数 3，关注 2 后应变 4
    useFollowStore.getState().hydrateUser(1, { isFollowing: false, followerCount: 0, followingCount: 3 })
    useFollowStore.getState().hydrateUser(2, { isFollowing: false, followerCount: 10, followingCount: 0 })
    toggleFollowMock.mockResolvedValue({ following: true })

    await useFollowStore.getState().toggle(2)

    expect(useFollowStore.getState().countsMap[1].followingCount).toBe(4)
  })

  it('取关：当前用户自己的 followingCount -1', async () => {
    useFollowStore.getState().hydrateUser(1, { isFollowing: false, followerCount: 0, followingCount: 3 })
    useFollowStore.getState().hydrateUser(2, { isFollowing: true, followerCount: 10, followingCount: 0 })
    toggleFollowMock.mockResolvedValue({ following: false })

    await useFollowStore.getState().toggle(2)

    expect(useFollowStore.getState().countsMap[1].followingCount).toBe(2)
  })

  it('不能关注自己：toggle(selfId) 直接返回，不发请求不改状态', async () => {
    selfIdState = 5
    useFollowStore.getState().hydrateUser(5, { isFollowing: false, followerCount: 8, followingCount: 3 })

    await useFollowStore.getState().toggle(5)

    expect(toggleFollowMock).not.toHaveBeenCalled()
    expect(useFollowStore.getState().isFollowing(5)).toBe(false)
    expect(useFollowStore.getState().countsMap[5].followerCount).toBe(8)
  })

  it('取关：乐观更新 isFollowing=false 且粉丝 -1', async () => {
    useFollowStore.getState().hydrateUser(2, { isFollowing: true, followerCount: 10, followingCount: 0 })
    toggleFollowMock.mockResolvedValue({ following: false })

    await useFollowStore.getState().toggle(2)

    expect(useFollowStore.getState().isFollowing(2)).toBe(false)
    expect(useFollowStore.getState().countsMap[2].followerCount).toBe(9)
  })

  it('后端结果校正：乐观关注但后端返回未关注，以后端为准', async () => {
    useFollowStore.getState().hydrateUser(2, { isFollowing: false, followerCount: 10, followingCount: 0 })
    // 乐观会置 true+11，但后端返回 following=false → 校正回 false，且计数按后端归位
    toggleFollowMock.mockResolvedValue({ following: false })

    await useFollowStore.getState().toggle(2)

    expect(useFollowStore.getState().isFollowing(2)).toBe(false)
    // 校正后粉丝数应回到未关注基线 10
    expect(useFollowStore.getState().countsMap[2].followerCount).toBe(10)
  })

  it('请求失败：回滚到操作前状态', async () => {
    useFollowStore.getState().hydrateUser(2, { isFollowing: false, followerCount: 10, followingCount: 0 })
    toggleFollowMock.mockRejectedValue(new Error('network'))

    await useFollowStore.getState().toggle(2)

    // 回滚：仍未关注，粉丝数仍为 10
    expect(useFollowStore.getState().isFollowing(2)).toBe(false)
    expect(useFollowStore.getState().countsMap[2].followerCount).toBe(10)
  })

  it('未登录：toggle 触发 login 且不发关注请求', async () => {
    isLoginState = false
    loginMock.mockResolvedValue(undefined)
    useFollowStore.getState().hydrateUser(2, { isFollowing: false, followerCount: 10, followingCount: 0 })

    await useFollowStore.getState().toggle(2)

    expect(loginMock).toHaveBeenCalled()
    expect(toggleFollowMock).not.toHaveBeenCalled()
    // 状态不变
    expect(useFollowStore.getState().isFollowing(2)).toBe(false)
    expect(useFollowStore.getState().countsMap[2].followerCount).toBe(10)
  })

  it('未 hydrate 的用户也能 toggle（计数缺省从 0 起）', async () => {
    toggleFollowMock.mockResolvedValue({ following: true })

    await useFollowStore.getState().toggle(7)

    expect(useFollowStore.getState().isFollowing(7)).toBe(true)
  })
})
