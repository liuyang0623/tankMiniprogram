import { describe, it, expect } from 'vitest'
import { notificationSummary } from '../notification'
import type { NotificationItem } from '../../types/notification'

function make(type: NotificationItem['type'], nickname = 'Alice'): NotificationItem {
  return {
    id: 1,
    type,
    actor: { id: 9, nickname, avatar: '' },
    read: false,
    createdAt: '2026-07-17T00:00:00Z',
  }
}

describe('notificationSummary', () => {
  it('follow 文案', () => {
    expect(notificationSummary(make('follow'))).toBe('Alice 关注了你')
  })

  it('like 文案', () => {
    expect(notificationSummary(make('like'))).toBe('Alice 赞了你的帖子')
  })

  it('comment 文案', () => {
    expect(notificationSummary(make('comment'))).toBe('Alice 评论了你的帖子')
  })

  it('空昵称兜底为"有人"', () => {
    expect(notificationSummary(make('follow', ''))).toBe('有人 关注了你')
  })
})
