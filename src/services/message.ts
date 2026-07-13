import { authRequest } from './authRequest'
import type { ConversationItem, MessageItem, PaginatedConversations, PaginatedMessages } from '../types/api'

/**
 * 发送消息
 */
export function sendMessage(toUserId: number, content: string, type: 'text' | 'image' = 'text') {
  return authRequest<MessageItem>({
    url: '/messages',
    method: 'POST',
    data: { toUserId, type, content },
  })
}

/**
 * 获取会话列表
 */
export function getConversations(page = 1, limit = 20) {
  return authRequest<PaginatedConversations>({
    url: '/conversations',
    method: 'GET',
    data: { page, limit },
  })
}

/**
 * 获取历史消息
 */
export function getMessages(conversationId: number, page = 1, limit = 20) {
  return authRequest<PaginatedMessages>({
    url: `/conversations/${conversationId}/messages`,
    method: 'GET',
    data: { page, limit },
  })
}

/**
 * 标记已读
 */
export function markRead(conversationId: number) {
  return authRequest<{ success: boolean }>({
    url: `/conversations/${conversationId}/read`,
    method: 'POST',
  })
}

/**
 * 查询与某用户的会话 id（0 表示无会话）。供他人主页私信入口定位历史。
 */
export function findConversation(withUserId: number) {
  return authRequest<{ conversationId: number }>({
    url: '/conversations',
    method: 'GET',
    data: { withUser: withUserId },
  })
}
