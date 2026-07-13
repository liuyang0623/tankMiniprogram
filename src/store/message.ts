import { create } from 'zustand'
import Taro from '@tarojs/taro'
import { getConversations, markRead as markReadApi } from '../services/message'
import type { ConversationItem, MessageItem } from '../types/api'

interface MessageState {
  conversations: ConversationItem[]
  unreadTotal: number
  loaded: boolean
  loading: boolean
  /** 最近一条 WS 推送的消息，供当前聊天页订阅追加 */
  lastIncoming: MessageItem | null
  /** 加载会话列表（首次加载或下拉刷新） */
  loadConversations: () => Promise<void>
  /** 收到新消息推送时调用 */
  onNewMessage: (msg: MessageItem) => void
  /** 标记会话已读 */
  markRead: (conversationId: number) => Promise<void>
  /** 重置状态（登出时） */
  reset: () => void
}

function updateTabBadge(count: number) {
  if (count > 0) {
    Taro.setTabBarBadge({ index: 1, text: count > 99 ? '99+' : String(count) }).catch(() => {})
  } else {
    Taro.removeTabBarBadge({ index: 1 }).catch(() => {})
  }
}

export const useMessageStore = create<MessageState>((set, get) => ({
  conversations: [],
  unreadTotal: 0,
  loaded: false,
  loading: false,
  lastIncoming: null,

  loadConversations: async () => {
    const { loading, loaded } = get()
    if (loading) return
    set({ loading: true })
    try {
      const res = await getConversations(1, 50)
      const unreadTotal = res.data.reduce((sum, c) => sum + c.unreadCount, 0)
      set({ conversations: res.data, unreadTotal, loaded: true, loading: false })
      updateTabBadge(unreadTotal)
    } catch {
      set({ loading: false })
    }
  },

  onNewMessage: (msg) => {
    // 记录最近推送，供当前聊天页订阅追加
    set({ lastIncoming: msg })
    const { conversations } = get()
    const existingIdx = conversations.findIndex((c) => c.id === msg.conversationId)

    if (existingIdx >= 0) {
      // Update existing conversation
      const updated = [...conversations]
      const conv = { ...updated[existingIdx] }
      conv.lastMessage = msg.content
      conv.lastTime = msg.createdAt
      conv.unreadCount += 1
      // Move to top
      updated.splice(existingIdx, 1)
      updated.unshift(conv)
      const unreadTotal = get().unreadTotal + 1
      set({ conversations: updated, unreadTotal })
      updateTabBadge(unreadTotal)
    } else {
      // New conversation — reload full list to get otherUser info
      get().loadConversations()
    }
  },

  markRead: async (conversationId) => {
    try {
      await markReadApi(conversationId)
      const { conversations, unreadTotal } = get()
      const idx = conversations.findIndex((c) => c.id === conversationId)
      if (idx >= 0) {
        const conv = conversations[idx]
        const delta = conv.unreadCount
        const updated = [...conversations]
        updated[idx] = { ...conv, unreadCount: 0 }
        const newTotal = unreadTotal - delta
        set({ conversations: updated, unreadTotal: newTotal })
        updateTabBadge(newTotal)
      }
    } catch {
      // Silently fail; backend will reconcile on next load
    }
  },

  reset: () => {
    set({ conversations: [], unreadTotal: 0, loaded: false, loading: false, lastIncoming: null })
    updateTabBadge(0)
  },
}))