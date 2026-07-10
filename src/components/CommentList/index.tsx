import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import { usePagedList } from '../../hooks/usePagedList'
import { interactionsApi } from '../../services/api'
import CommentItem from '../CommentItem'
import CommentInput from '../CommentInput'
import { Skeleton } from '../index'
import type { Comment } from '../../types/api'

export interface CommentListProps {
  postId: number
}

/** 评论区：列表（分页）+ 输入框 + 回复 */
export default function CommentList({ postId }: CommentListProps) {
  const comments = usePagedList<Comment>((page) => interactionsApi.getComments(postId, page))
  const [replyTo, setReplyTo] = useState<Comment | null>(null)

  useEffect(() => {
    comments.reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  const handleSubmitted = (created: Comment, parentId?: number) => {
    comments.setList((prev) => {
      if (!parentId) return [created, ...prev]
      // 回复：挂到对应父评论的 replies 下
      return prev.map((c) =>
        c.id === parentId ? { ...c, replies: [...(c.replies || []), created] } : c,
      )
    })
  }

  const handleDeleted = (id: number) => {
    comments.setList((prev) =>
      prev
        .filter((c) => c.id !== id)
        .map((c) => ({ ...c, replies: (c.replies || []).filter((r) => r.id !== id) })),
    )
  }

  const isFirstLoading = comments.loading && comments.list.length === 0

  return (
    <View className='mt-4'>
      <Text className='text-base text-ink font-bold'>评论</Text>

      <View className='mt-4'>
        {isFirstLoading && <Skeleton rows={3} />}

        {!isFirstLoading && comments.list.length === 0 && (
          <View className='py-6 items-center'>
            <Text className='text-sm text-ink-sub'>还没有评论，来抢沙发～</Text>
          </View>
        )}

        {comments.list.map((c) => (
          <CommentItem key={c.id} comment={c} onReply={setReplyTo} onDeleted={handleDeleted} />
        ))}

        {comments.list.length > 0 && (
          <View className='press py-3 items-center' onClick={() => comments.loadMore()}>
            <Text className='text-xs text-ink-sub'>
              {comments.loading ? '加载中…' : comments.hasMore ? '加载更多评论' : '没有更多了'}
            </Text>
          </View>
        )}
      </View>

      {/* 输入框固定在评论区底部 */}
      <CommentInput
        postId={postId}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onSubmitted={handleSubmitted}
      />
    </View>
  )
}
