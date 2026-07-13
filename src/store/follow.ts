import { create } from 'zustand'
import Taro from '@tarojs/taro'
import { usersApi } from '../services/api/users'
import { login } from '../services/auth'
import { useAuthStore } from './auth'

/** 某用户的计数快照（展示值，非强一致） */
export interface UserCounts {
  followerCount: number
  followingCount: number
  likeCount?: number
}

interface HydrateData {
  isFollowing: boolean
  followerCount: number
  followingCount: number
  likeCount?: number
}

interface FollowState {
  /** 目标用户 id -> 当前登录用户是否已关注 */
  followingMap: Record<number, boolean>
  /** 目标用户 id -> 计数快照 */
  countsMap: Record<number, UserCounts>
  /** 用接口数据填充某用户的关注状态与计数（页面进入时补偿） */
  hydrateUser: (id: number, data: HydrateData) => void
  /** 读取是否已关注（未知用户返回 false） */
  isFollowing: (id: number) => boolean
  /** 关注/取关：未登录引导登录；已登录乐观更新 + 后端校正 + 失败回滚 */
  toggle: (id: number) => Promise<void>
}

/** 根据操作前状态与目标关注态计算粉丝数增量 */
function applyFollowerDelta(base: number, prevFollowing: boolean, nextFollowing: boolean): number {
  if (nextFollowing === prevFollowing) return base
  return nextFollowing ? base + 1 : base - 1
}

export const useFollowStore = create<FollowState>((set, get) => ({
  followingMap: {},
  countsMap: {},

  hydrateUser: (id, data) => {
    set((s) => ({
      followingMap: { ...s.followingMap, [id]: data.isFollowing },
      countsMap: {
        ...s.countsMap,
        [id]: {
          followerCount: data.followerCount,
          followingCount: data.followingCount,
          likeCount: data.likeCount,
        },
      },
    }))
  },

  isFollowing: (id) => get().followingMap[id] ?? false,

  toggle: async (id) => {
    // 未登录：引导登录，不发关注请求
    if (!useAuthStore.getState().isLogin) {
      try {
        await login()
      } catch {
        // 登录失败静默，不改状态
      }
      return
    }

    // 操作前基线快照（用于校正与回滚）
    const prevFollowing = get().followingMap[id] ?? false
    const prevCounts = get().countsMap[id] ?? { followerCount: 0, followingCount: 0 }
    const optimistic = !prevFollowing

    // 乐观更新
    set((s) => ({
      followingMap: { ...s.followingMap, [id]: optimistic },
      countsMap: {
        ...s.countsMap,
        [id]: {
          ...prevCounts,
          followerCount: applyFollowerDelta(prevCounts.followerCount, prevFollowing, optimistic),
        },
      },
    }))

    try {
      const { following } = await usersApi.toggleFollow(id)
      // 以后端结果为准校正：粉丝数从操作前基线按后端方向计算
      set((s) => ({
        followingMap: { ...s.followingMap, [id]: following },
        countsMap: {
          ...s.countsMap,
          [id]: {
            ...(s.countsMap[id] ?? prevCounts),
            followerCount: applyFollowerDelta(prevCounts.followerCount, prevFollowing, following),
          },
        },
      }))
    } catch {
      // 回滚到操作前
      set((s) => ({
        followingMap: { ...s.followingMap, [id]: prevFollowing },
        countsMap: { ...s.countsMap, [id]: prevCounts },
      }))
      Taro.showToast({ title: '操作失败，请重试', icon: 'none' })
    }
  },
}))
