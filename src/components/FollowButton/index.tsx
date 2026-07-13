import { View, Text } from '@tarojs/components'
import type { ITouchEvent } from '@tarojs/components'
import { useFollowStore } from '../../store/follow'

export interface FollowButtonProps {
  /** 目标用户 id */
  userId: number
  /** 尺寸：normal 用于主页，small 用于列表项 */
  size?: 'normal' | 'small'
  className?: string
}

/**
 * 关注/已关注按钮，读全局 followStore，点击 toggle。
 * 自带 stopPropagation，可安全放在可点击的行/卡片内。
 */
export default function FollowButton({ userId, size = 'normal', className = '' }: FollowButtonProps) {
  const following = useFollowStore((s) => s.followingMap[userId] ?? false)
  const toggle = useFollowStore((s) => s.toggle)

  const pad = size === 'small' ? 'px-4 py-1' : 'px-6 py-2'
  const text = size === 'small' ? 'text-xs' : 'text-sm'
  const tone = following ? 'bg-transparent border border-ink-sub text-ink-sub' : 'bg-peach text-card'

  return (
    <View
      className={`press inline-flex items-center justify-center rounded-pill ${pad} ${text} ${tone} ${className}`}
      onClick={(e: ITouchEvent) => {
        e.stopPropagation()
        toggle(userId)
      }}
    >
      <Text className={text}>{following ? '已关注' : '关注'}</Text>
    </View>
  )
}
