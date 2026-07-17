import { create } from 'zustand'
import { notificationApi } from '../services/api/notification'
import { refreshMessageTabBadge } from '../utils/tabBadge'
import type { NotificationItem } from '../types/notification'

interface NotificationState {
  /** 未读总数（消息页聚合入口红点） */
  unreadCount: number
  /** 最新一条通知（入口摘要展示） */
  latest: NotificationItem | null
  /** 详情页列表 */
  list: NotificationItem[]
  loading: boolean
  /** 刷新未读数 + 最新摘要（消息页进入时调用） */
  refreshUnread: () => Promise<void>
  /** 加载通知列表（详情页进入时调用） */
  loadList: () => Promise<void>
  /** 整体标记已读（详情页进入后调用），清零未读 */
  markRead: () => Promise<void>
  /** 重置（登出时） */
  reset: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  latest: null,
  list: [],
  loading: false,

  refreshUnread: async () => {
    try {
      const res = await notificationApi.unreadCount()
      set({ unreadCount: res.unreadCount, latest: res.latest })
      refreshMessageTabBadge()
    } catch {
      // 未登录或网络失败，忽略
    }
  },

  loadList: async () => {
    set({ loading: true })
    try {
      const res = await notificationApi.list(1)
      set({ list: res.data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  markRead: async () => {
    try {
      await notificationApi.markRead()
      set((s) => ({
        unreadCount: 0,
        list: s.list.map((n) => ({ ...n, read: true })),
      }))
      refreshMessageTabBadge()
    } catch {
      // 失败不清红点，下次进入重试
    }
  },

  reset: () => {
    set({ unreadCount: 0, latest: null, list: [], loading: false })
    refreshMessageTabBadge()
  },
}))
