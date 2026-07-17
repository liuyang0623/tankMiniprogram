import type { NotificationItem } from '../types/notification'

/** 按通知类型生成摘要文案（展示层拼接，后端只给结构化数据） */
export function notificationSummary(n: NotificationItem): string {
  const name = n.actor?.nickname || '有人'
  switch (n.type) {
    case 'follow':
      return `${name} 关注了你`
    case 'like':
      return `${name} 赞了你的帖子`
    case 'comment':
      return `${name} 评论了你的帖子`
    default:
      return `${name} 与你互动`
  }
}
