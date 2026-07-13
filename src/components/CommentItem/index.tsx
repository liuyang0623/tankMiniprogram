import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Avatar } from '../index'
import { interactionsApi } from '../../services/api'
import { useAuthStore } from '../../store/auth'
import { useUiStore } from '../../store/ui'
import { nextToggleState } from '../../hooks/useOptimisticToggle'
import { goUserProfile } from '../../utils/navigation'
import type { Comment } from '../../types/api'

export interface CommentItemProps {
  comment: Comment
  depth?: number
  onReply: (comment: Comment) => void
  onDeleted: (id: number) => void
}

const MAX_INDENT_DEPTH = 3

/** 单条评论，递归渲染回复，支持评论点赞与删除本人评论 */
export default function CommentItem({ comment, depth = 0, onReply, onDeleted }: CommentItemProps) {
  const [like, setLike] = useState({
    active: !!comment.isLiked,
    count: comment.likeCount || 0,
  })
  const currentUserId = useAuthStore((s) => s.user?.id)
  const showToast = useUiStore((s) => s.showToast)
  const isMine = currentUserId != null && comment.authorId === currentUserId

  const indent = Math.min(depth, MAX_INDENT_DEPTH) * 24

  const onLike = () => {
    const prev = like
    setLike(nextToggleState(prev))
    // 后端暂无评论点赞接口：预留调用，失败回滚
    interactionsApi.likeComment(comment.id).catch(() => setLike(prev))
  }

  const onDelete = async () => {
    const { confirm } = await Taro.showModal({ title: '删除评论', content: '确定删除这条评论吗？' })
    if (!confirm) return
    try {
      await interactionsApi.deleteComment(comment.id)
      onDeleted(comment.id)
    } catch {
      showToast('删除失败，请重试', 'error')
    }
  }

  const goProfile = () => {
    goUserProfile(comment.authorId)
  }

  return (
    <View style={{ marginLeft: `${indent}rpx` }} className='mb-4'>
      <View className='flex items-start'>
        <View className='press' onClick={goProfile}>
          <Avatar src={comment.author?.avatar} size={48} />
        </View>
        <View className='ml-2 flex-1'>
          <View className='press' onClick={goProfile}>
            <Text className='text-xs text-ink-sub'>{comment.author?.name || '匿名'}</Text>
          </View>
          <View className='mt-1'>
            <Text className='text-sm text-ink'>{comment.content}</Text>
          </View>
          {/* 操作行 */}
          <View className='flex items-center mt-2'>
            <View className='press mr-6' onClick={onLike}>
              <Text className='text-xs' style={{ color: like.active ? 'var(--c-heart)' : 'var(--c-ink-sub)' }}>
                {like.active ? '♥' : '♡'} {like.count > 0 ? like.count : ''}
              </Text>
            </View>
            <View className='press mr-6' onClick={() => onReply(comment)}>
              <Text className='text-xs text-ink-sub'>回复</Text>
            </View>
            {isMine && (
              <View className='press' onClick={onDelete}>
                <Text className='text-xs text-ink-sub'>删除</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* 递归渲染回复 */}
      {comment.replies && comment.replies.length > 0 && (
        <View className='mt-3'>
          {comment.replies.map((r) => (
            <CommentItem key={r.id} comment={r} depth={depth + 1} onReply={onReply} onDeleted={onDeleted} />
          ))}
        </View>
      )}
    </View>
  )
}
