import type { Paginated } from './api'

/** 系统通知类型（follow 先落地，预留 like/comment） */
export type NotificationType = 'follow' | 'like' | 'comment'

/** 通知触发者的展示信息 */
export interface NotificationActor {
  id: number
  nickname: string
  avatar: string
}

export interface NotificationItem {
  id: number
  type: NotificationType
  actor: NotificationActor
  targetId?: number
  read: boolean
  createdAt: string
}

export type PaginatedNotifications = Paginated<NotificationItem>

/** 未读数 + 最新一条摘要，供消息页聚合入口展示 */
export interface UnreadSummary {
  unreadCount: number
  latest: NotificationItem | null
}
