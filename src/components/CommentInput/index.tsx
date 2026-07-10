import { useState, useRef } from 'react'
import { View, Textarea } from '@tarojs/components'
import { interactionsApi } from '../../services/api'
import { useAuthGuard } from '../../hooks/useAuthGuard'
import { useUiStore } from '../../store/ui'
import type { Comment } from '../../types/api'

export interface CommentInputProps {
  postId: number
  replyTo: Comment | null
  onCancelReply: () => void
  onSubmitted: (comment: Comment, parentId?: number) => void
}

/** 评论输入框：支持发表顶层评论与回复，未登录引导登录 */
export default function CommentInput({ postId, replyTo, onCancelReply, onSubmitted }: CommentInputProps) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const guard = useAuthGuard()
  const showToast = useUiStore((s) => s.showToast)

  const submit = () =>
    guard(async () => {
      // 防重复提交：ref 立即生效，避免异步 setState 前的连点
      if (submittingRef.current) return
      const text = content.trim()
      if (!text) {
        showToast('说点什么吧～', 'info')
        return
      }
      submittingRef.current = true
      setSubmitting(true)
      try {
        const created = await interactionsApi.createComment({
          postId,
          content: text,
          parentId: replyTo?.id,
        })
        setContent('')
        onSubmitted(created, replyTo?.id)
        onCancelReply()
      } catch {
        showToast('发送失败，请重试', 'error')
      } finally {
        submittingRef.current = false
        setSubmitting(false)
      }
    })

  return (
    <View
      className='flex items-end px-4 py-3 bg-card'
      style={{ borderTop: '1rpx solid #EFE8DE' }}
    >
      <Textarea
        className='flex-1 text-sm text-ink'
        style={{ minHeight: '64rpx', maxHeight: '200rpx' }}
        value={content}
        placeholder={replyTo ? `回复 @${replyTo.author?.name || '匿名'}` : '写下你的随想…'}
        autoHeight
        onInput={(e) => setContent(e.detail.value)}
      />
      {replyTo && (
        <View className='press ml-2 px-3 py-2' onClick={onCancelReply}>
          <View className='text-xs text-ink-sub'>取消</View>
        </View>
      )}
      <View
        className={`press ml-2 rounded-pill px-5 py-2 ${submitting ? 'opacity-50' : ''}`}
        style={{ background: '#F0A868' }}
        onClick={submit}
      >
        <View className='text-sm' style={{ color: '#fff' }}>
          发送
        </View>
      </View>
    </View>
  )
}
