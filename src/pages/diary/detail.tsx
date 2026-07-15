import { useState } from 'react'
import { View, Text, RichText, ScrollView } from '@tarojs/components'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import { PageLayout } from '../../components'
import { diaryApi } from '../../services/api'
import { moodEmoji, weatherEmoji } from '../../types/diary'
import { formatRelativeTime } from '../../utils/time'
import { useUiStore } from '../../store/ui'
import type { Diary } from '../../types/diary'

type LoadState = 'loading' | 'success' | 'error'

export default function DiaryDetail() {
  const router = useRouter()
  const id = Number(router.params.id)
  const showToast = useUiStore((s) => s.showToast)
  const [state, setState] = useState<LoadState>('loading')
  const [diary, setDiary] = useState<Diary | null>(null)

  const load = async () => {
    if (!id) {
      setState('error')
      return
    }
    setState('loading')
    try {
      const res = await diaryApi.detail(id)
      setDiary(res)
      setState('success')
    } catch {
      setState('error')
    }
  }

  useDidShow(() => {
    load()
  })

  const onEdit = () => {
    Taro.navigateTo({ url: `/pages/diary/edit?id=${id}` })
  }

  const onDelete = async () => {
    const res = await Taro.showModal({ title: '删除日记', content: '确认删除这篇日记吗？' })
    if (res.confirm) {
      try {
        await diaryApi.remove(id)
        showToast('已删除', 'success')
        Taro.navigateBack()
      } catch {
        showToast('删除失败', 'error')
      }
    }
  }

  return (
    <PageLayout>
      <ScrollView scrollY className='min-h-screen bg-bg'>
        <View className='px-6 pt-12 pb-10'>
          {state === 'loading' && (
            <View className='py-10 items-center'>
              <Text className='text-sm text-ink-sub'>加载中…</Text>
            </View>
          )}

          {state === 'error' && (
            <View className='py-10 items-center'>
              <Text className='text-sm text-ink-sub'>日记加载失败</Text>
              <View className='press bg-peach rounded-pill px-6 py-2 mt-4' onClick={load}>
                <Text className='text-sm text-card'>重新加载</Text>
              </View>
            </View>
          )}

          {state === 'success' && diary && (
            <View className='anim-in'>
              <Text className='text-2xl text-ink font-bold'>{diary.title || '无标题'}</Text>
              <View className='flex items-center mt-3 mb-4'>
                {diary.mood ? <Text className='text-lg mr-2'>{moodEmoji(diary.mood)}</Text> : null}
                {diary.weather ? <Text className='text-lg mr-2'>{weatherEmoji(diary.weather)}</Text> : null}
                <Text className='text-xs text-ink-sub'>{formatRelativeTime(diary.createdAt)}</Text>
              </View>
              <RichText className='text-base text-ink' nodes={diary.content} />

              <View className='flex mt-8'>
                <View className='press bg-peach rounded-pill px-6 py-2 mr-4' onClick={onEdit}>
                  <Text className='text-sm text-card'>编辑</Text>
                </View>
                <View className='press bg-card rounded-pill px-6 py-2' onClick={onDelete}>
                  <Text className='text-sm text-heart'>删除</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </PageLayout>
  )
}
