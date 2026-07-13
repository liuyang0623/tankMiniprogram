import { View, Text } from '@tarojs/components'
import type { ITouchEvent } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { ReactNode } from 'react'
import { Card, Avatar, Tag } from '../index'
import type { Post } from '../../types/api'

export interface PostCardProps {
  post: Post
  /** 可选卡片内操作区，渲染在右上角，点击不触发卡片跳转 */
  action?: ReactNode
  /** 可选覆盖卡片点击行为，不传时默认进详情页 */
  onCardClick?: () => void
}

/** 信息流帖子卡片，点击进详情；可选右上角 action 区、可选覆盖点击行为 */
export default function PostCard({ post, action, onCardClick }: PostCardProps) {
  const goDetail = () => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${post.id}` })
  }

  const goAuthor = (e: ITouchEvent) => {
    e.stopPropagation()
    if (post.author?.id != null) {
      Taro.navigateTo({ url: `/pages/user-profile/index?id=${post.author.id}` })
    }
  }

  const summary = post.content?.replace(/<[^>]+>/g, '').slice(0, 60) || ''

  return (
    <Card float className='mb-4' onClick={onCardClick ?? goDetail}>
      {action && (
        <View
          className='absolute'
          style={{ top: '16rpx', right: '16rpx', zIndex: 2 }}
          onClick={(e: ITouchEvent) => e.stopPropagation()}
        >
          {action}
        </View>
      )}
      {/* 作者 */}
      <View className='flex items-center mb-3' onClick={goAuthor}>
        <Avatar src={post.author?.avatar} size={64} />
        <View className='ml-3'>
          <Text className='text-sm text-ink'>{post.author?.name || '匿名'}</Text>
        </View>
      </View>
      {/* 标题与摘要 */}
      <Text className='text-base text-ink font-bold'>{post.title}</Text>
      <View className='mt-1 mb-3'>
        <Text className='text-sm text-ink-sub'>
          {summary}
          {summary.length >= 60 ? '…' : ''}
        </Text>
      </View>
      {/* 话题 */}
      {post.topics && post.topics.length > 0 && (
        <View className='flex mb-3'>
          {post.topics.slice(0, 3).map((t) => (
            <Tag key={t.id} tone='taro' className='mr-2'>
              {t.name}
            </Tag>
          ))}
        </View>
      )}
      {/* 互动计数 */}
      <View className='flex'>
        <Text className='text-xs text-ink-sub mr-4'>♡ {post.likeCount}</Text>
        <Text className='text-xs text-ink-sub'>💬 {post.commentCount}</Text>
      </View>
    </Card>
  )
}
