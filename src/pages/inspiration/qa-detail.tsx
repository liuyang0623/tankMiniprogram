import { useState, useCallback } from 'react'
import { View, Text, Textarea, ScrollView } from '@tarojs/components'
import { useRouter, useDidShow } from '@tarojs/taro'
import { PageLayout } from '../../components'
import { qaApi } from '../../services/api'
import { useUiStore } from '../../store/ui'
import { formatRelativeTime } from '../../utils/time'
import type { Question } from '../../types/inspiration'
import './qa-detail.scss'

export default function QaDetailPage() {
  const router = useRouter()
  const id = Number(router.params.id)
  const [question, setQuestion] = useState<Question | null>(null)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const showToast = useUiStore((s) => s.showToast)

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

  const onSubmit = async () => {
    if (submitting) return
    if (!content.trim()) {
      showToast('回答内容不能为空', 'error')
      return
    }
    setSubmitting(true)
    try {
      await qaApi.answer(id, { content: content.trim() })
      setContent('')
      showToast('回答成功')
      load()
    } catch {
      showToast('回答失败，请重试', 'error')
    } finally {
      setSubmitting(false)
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
                <Text className='qad-question__content'>{question.content}</Text>
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
                <Text className='qad-answer__content'>{a.content}</Text>
                <Text className='qad-answer__time'>{formatRelativeTime(a.createdAt)}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View className='qad-input'>
          <Textarea
            className='qad-input__field'
            value={content}
            placeholder='写下你的回答…'
            maxlength={500}
            autoHeight
            onInput={(e) => setContent(e.detail.value)}
          />
          <View className='qad-input__btn press' onClick={onSubmit}>
            <Text className='qad-input__btn-text'>{submitting ? '…' : '回答'}</Text>
          </View>
        </View>
      </View>
    </PageLayout>
  )
}
