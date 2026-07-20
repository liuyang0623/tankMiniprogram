import { useState, useCallback, useRef } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { PageLayout, BottomSheet, RichEditor } from '../../components'
import type { RichEditorHandle } from '../../components'
import { qaApi } from '../../services/api'
import { useAuthStore } from '../../store/auth'
import { useUiStore } from '../../store/ui'
import { login } from '../../services/auth'
import { formatRelativeTime } from '../../utils/time'
import type { QuestionListItem } from '../../types/inspiration'
import './qa.scss'

export default function QaPage() {
  const [list, setList] = useState<QuestionListItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [askOpen, setAskOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const isLogin = useAuthStore((s) => s.isLogin)
  const showToast = useUiStore((s) => s.showToast)
  const editorRef = useRef<RichEditorHandle>(null)

  const load = useCallback(async () => {
    if (!useAuthStore.getState().isLogin) return
    try {
      const r = await qaApi.list({ page: 1, limit: 20 })
      setList(r.data)
    } catch {
      setList([])
    } finally {
      setLoaded(true)
    }
  }, [])

  useDidShow(() => {
    load()
  })

  const openAsk = () => {
    setTitle('')
    setAskOpen(true)
  }

  const onSubmitAsk = async () => {
    if (submitting) return
    if (!title.trim()) {
      showToast('标题不能为空', 'error')
      return
    }
    const { html } = (await editorRef.current?.getContents()) || { html: '', text: '' }
    setSubmitting(true)
    try {
      await qaApi.create({ title: title.trim(), content: html })
      setAskOpen(false)
      showToast('已发布，等待大家的回答')
      load()
    } catch {
      showToast('发布失败，请重试', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isLogin) {
    return (
      <PageLayout>
        <View className='qa-guest'>
          <Text className='qa-guest__emoji'>💬</Text>
          <Text className='qa-guest__title'>登录后一起解惑</Text>
          <Text className='qa-guest__hint'>把困惑说出来，也帮别人解答</Text>
          <View
            className='qa-guest__btn press'
            onClick={() => {
              login()
                .then(() => load())
                .catch((e: any) => showToast(e?.message || '登录失败，请重试', 'error'))
            }}
          >
            <Text className='qa-guest__btn-text'>微信一键登录</Text>
          </View>
        </View>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <View className='qa-page'>
        <View className='qa-head anim-in'>
          <Text className='qa-head__title'>解惑广场</Text>
          <Text className='qa-head__sub'>你的问题，会有人温柔接住</Text>
        </View>

        <View className='qa-list'>
          {list.length === 0 && loaded ? (
            <View className='qa-empty'>
              <Text className='qa-empty__emoji'>🌱</Text>
              <Text className='qa-empty__text'>还没有人提问，来提出第一个吧</Text>
            </View>
          ) : (
            list.map((q, i) => (
              <View
                key={q.id}
                className='qa-item press anim-stagger'
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                onClick={() => Taro.navigateTo({ url: `/pages/inspiration/qa-detail?id=${q.id}` })}
              >
                <Text className='qa-item__title'>{q.title}</Text>
                <View className='qa-item__meta'>
                  <Text className='qa-item__answers'>{q.answerCount} 个回答</Text>
                  <Text className='qa-item__time'>{formatRelativeTime(q.createdAt)}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View className='qa-fab press' onClick={openAsk}>
          <Text className='qa-fab__text'>提问</Text>
        </View>
      </View>

      <BottomSheet
        visible={askOpen}
        title='说说你的困惑'
        confirmText={submitting ? '…' : '发布'}
        confirmDisabled={submitting}
        onConfirm={onSubmitAsk}
        onClose={() => setAskOpen(false)}
      >
        {askOpen && (
          <View className='qa-ask'>
            <Input
              className='qa-ask__title'
              value={title}
              placeholder='一句话描述你的问题'
              maxlength={100}
              onInput={(e) => setTitle(e.detail.value)}
            />
            <RichEditor ref={editorRef} placeholder='补充说明你的困惑（选填）…' />
          </View>
        )}
      </BottomSheet>
    </PageLayout>
  )
}
