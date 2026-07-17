import { authRequest } from '../authRequest'
import type { PaginatedNotifications, UnreadSummary } from '../../types/notification'

export const notificationApi = {
  /** 我的系统通知列表（倒序分页） */
  list: (page = 1) =>
    authRequest<PaginatedNotifications>({ url: `/notifications?page=${page}` }),
  /** 整体标记已读 */
  markRead: () => authRequest<{ ok: boolean }>({ url: '/notifications/read', method: 'POST' }),
  /** 未读总数 + 最新一条摘要（消息页聚合入口用） */
  unreadCount: () => authRequest<UnreadSummary>({ url: '/notifications/unread-count' }),
}
