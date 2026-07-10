import { useState, useRef } from 'react'
import { View, Text } from '@tarojs/components'
import { interactionsApi } from '../../services/api'
import { useAuthGuard } from '../../hooks/useAuthGuard'
import { useUiStore } from '../../store/ui'
import { nextToggleState } from '../../hooks/useOptimisticToggle'

export interface InteractionBarProps {
  postId: number
  initialLiked: boolean
  initialFavorited: boolean
  initialLikeCount: number
}

/** 详情页互动栏：点赞、收藏（乐观更新 + 失败回滚 + 未登录守卫） */
export default function InteractionBar({
  postId,
  initialLiked,
  initialFavorited,
  initialLikeCount,
}: InteractionBarProps) {
  const [like, setLike] = useState({ active: initialLiked, count: initialLikeCount })
  const [favorited, setFavorited] = useState(initialFavorited)
  const likingRef = useRef(false)
  const favingRef = useRef(false)
  const guard = useAuthGuard()
  const showToast = useUiStore((s) => s.showToast)

  const onLike = () =>
    guard(async () => {
      if (likingRef.current) return
      likingRef.current = true
      const prev = like
      setLike(nextToggleState(prev))
      try {
        const { liked } = await interactionsApi.likePost(postId)
        setLike((cur) => (cur.active === liked ? cur : { active: liked, count: liked ? prev.count + 1 : Math.max(0, prev.count - 1) }))
      } catch {
        setLike(prev)
        showToast('操作失败，请重试', 'error')
      } finally {
        likingRef.current = false
      }
    })

  const onFavorite = () =>
    guard(async () => {
      if (favingRef.current) return
      favingRef.current = true
      const prev = favorited
      setFavorited(!prev)
      try {
        const { favorited: srv } = await interactionsApi.favoritePost(postId)
        setFavorited(srv)
      } catch {
        setFavorited(prev)
        showToast('操作失败，请重试', 'error')
      } finally {
        favingRef.current = false
      }
    })

  return (
    <View className='flex items-center py-4' style={{ borderTop: '1rpx solid #EFE8DE' }}>
      <View className={`press flex items-center mr-8 ${like.active ? '' : ''}`} onClick={onLike}>
        <Text style={{ fontSize: '40rpx', color: like.active ? '#EF8A7F' : '#8A7F76' }}>
          {like.active ? '♥' : '♡'}
        </Text>
        <Text className='text-sm ml-2' style={{ color: like.active ? '#EF8A7F' : '#8A7F76' }}>
          {like.count}
        </Text>
      </View>
      <View className='press flex items-center' onClick={onFavorite}>
        <Text style={{ fontSize: '40rpx', color: favorited ? '#F0A868' : '#8A7F76' }}>
          {favorited ? '★' : '☆'}
        </Text>
        <Text className='text-sm ml-2' style={{ color: favorited ? '#F0A868' : '#8A7F76' }}>
          收藏
        </Text>
      </View>
    </View>
  )
}
