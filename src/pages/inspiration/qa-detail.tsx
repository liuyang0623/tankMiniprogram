import { useState, useCallback, useRef } from 'react'
import { View, Text, RichText, ScrollView } from '@tarojs/components'
import { useRouter, useDidShow } from '@tarojs/taro'
import { PageLayout, BottomSheet, RichEditor } from '../../components'
import type { RichEditorHandle } from '../../components'
import { qaApi } from '../../services/api'
import { useAuthStore } from '../../store/auth'
import { useUiStore } from '../../store/ui'
import { formatRelativeTime } from '../../utils/time'
import type { Question, Answer } from '../../types/inspiration'
import './qa-detail.scss'

/** 回答排序：采纳置顶 → 赞数降序 → 早答优先（与后端一致，点赞后本地重排用）。 */
function sortAnswers(list: Answer[]): Answer[] {
  return [...list].sort((a, b) => {
    if (a.isAccepted !== b.isAccepted) return a.isAccepted ? -1 : 1
    if (a.likeCount !== b.likeCount) return b.likeCount - a.likeCount
    return a.createdAt.localeCompare(b.createdAt)
  })
}

/** 在赞数>0 的回答中把最高赞（并列取最早）标为最佳。 */
function markBest(list: Answer[]): Answer[] {
  let bestId = -1
  let bestLike = 0
  let bestTime = ''
  for (const a of list) {
    if (a.likeCount <= 0) continue
    if (a.likeCount > bestLike || (a.likeCount === bestLike && a.createdAt < bestTime)) {
      bestId = a.id
      bestLike = a.likeCount
      bestTime = a.createdAt
    }
  }
  return list.map((a) => ({ ...a, isBest: a.id === bestId }))
}

export default function QaDetailPage() {
  const router = useRouter()
  const id = Number(router.params.id)
  const [question, setQuestion] = useState<Question | null>(null)
  const [answerSheetOpen, setAnswerSheetOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const showToast = useUiStore((s) => s.showToast)
  const myId = useAuthStore((s) => s.user?.id)
  const editorRef = useRef<RichEditorHandle>(null)

  const isAuthor = !!question && question.authorId === myId

  const load = useCallback(async () => {
    try {
      const q = await qaApi.detail(id)
      setQuestion(q)
    } catch {
      setQuestion(null)
    }
  }, [id])

  useDidShow(() => {
    if (id) load()
  })

  const onSubmitAnswer = async () => {
    if (submitting) return
    const { html, text } = (await editorRef.current?.getContents()) || { html: '', text: '' }
    if (!text.trim()) {
      showToast('回答内容不能为空', 'error')
      return
    }
    setSubmitting(true)
    try {
      await qaApi.answer(id, { content: html })
      setAnswerSheetOpen(false)
      showToast('回答成功')
      load()
    } catch {
      showToast('回答失败，请重试', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // 点赞：乐观更新 + 本地重排，失败回滚。
  const onLike = async (answer: Answer) => {
    if (!question) return
    const optimistic = question.answers.map((a) =>
      a.id === answer.id
        ? { ...a, likedByMe: !a.likedByMe, likeCount: a.likeCount + (a.likedByMe ? -1 : 1) }
        : a,
    )
    setQuestion({ ...question, answers: sortAnswers(markBest(optimistic)) })
    try {
      const r = await qaApi.likeAnswer(id, answer.id)
      setQuestion((cur) => {
        if (!cur) return cur
        const synced = cur.answers.map((a) =>
          a.id === answer.id ? { ...a, likedByMe: r.liked, likeCount: r.likeCount } : a,
        )
        return { ...cur, answers: sortAnswers(markBest(synced)) }
      })
    } catch {
      showToast('操作失败，请重试', 'error')
      load() // 以服务端为准回滚
    }
  }

  const onAccept = async (answer: Answer) => {
    try {
      await qaApi.acceptAnswer(id, answer.id)
      showToast('已采纳')
      load()
    } catch {
      showToast('采纳失败，请重试', 'error')
    }
  }

  return (
    <PageLayout>
      <View className='qad-page'>
        <ScrollView scrollY className='qad-scroll'>
          {question && (
            <View className='qad-question anim-in'>
              <Text className='qad-question__title'>{question.title}</Text>
              {question.content ? (
                <View className='qad-question__content'>
                  <RichText nodes={question.content} />
                </View>
              ) : null}
              <Text className='qad-question__time'>{formatRelativeTime(question.createdAt)}</Text>
            </View>
          )}

          <View className='qad-answers'>
            <Text className='qad-answers__label'>
              {question ? `${question.answerCount} 个回答` : '回答'}
            </Text>
            {question && question.answers.length === 0 && (
              <View className='qad-empty'>
                <Text className='qad-empty__text'>还没有人回答，来说说你的想法吧</Text>
              </View>
            )}
            {question?.answers.map((a, i) => (
              <View
                key={a.id}
                className='qad-answer anim-stagger'
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
              >
                {(a.isBest || a.isAccepted) && (
                  <View className='qad-answer__badges'>
                    {a.isAccepted && <Text className='qad-badge qad-badge--accepted'>已采纳</Text>}
                    {a.isBest && <Text className='qad-badge qad-badge--best'>最佳回答</Text>}
                  </View>
                )}
                <View className='qad-answer__content'>
                  <RichText nodes={a.content} />
                </View>
                <View className='qad-answer__foot'>
                  <Text className='qad-answer__time'>{formatRelativeTime(a.createdAt)}</Text>
                  <View className='qad-answer__actions'>
                    {isAuthor && !a.isAccepted && (
                      <Text className='qad-accept press' onClick={() => onAccept(a)}>采纳</Text>
                    )}
                    <View
                      className={`qad-like press ${a.likedByMe ? 'is-liked' : ''}`}
                      onClick={() => onLike(a)}
                    >
                      <Text className='qad-like__icon'>{a.likedByMe ? '❤' : '♡'}</Text>
                      <Text className='qad-like__count'>{a.likeCount}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View className='qad-write'>
          <View className='qad-write__btn press' onClick={() => setAnswerSheetOpen(true)}>
            <Text className='qad-write__text'>写回答</Text>
          </View>
        </View>
      </View>

      <BottomSheet
        visible={answerSheetOpen}
        title='写下你的回答'
        confirmText={submitting ? '…' : '发布'}
        confirmDisabled={submitting}
        onConfirm={onSubmitAnswer}
        onClose={() => setAnswerSheetOpen(false)}
      >
        {answerSheetOpen && <RichEditor ref={editorRef} placeholder='认真回答，温柔接住 TA 的困惑…' />}
      </BottomSheet>
    </PageLayout>
  )
}
