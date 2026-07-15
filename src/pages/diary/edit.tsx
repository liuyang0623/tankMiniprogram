import { useEffect, useRef, useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro, { getCurrentInstance } from '@tarojs/taro'
import RichEditor, { RichEditorHandle } from '../../components/RichEditor'
import { PageLayout, MoodWeatherPicker } from '../../components'
import { firstImage, extractImagesInOrder } from '../../utils/publish'
import { diaryApi } from '../../services/api'
import { useAuthStore } from '../../store/auth'
import { useUiStore } from '../../store/ui'

export default function DiaryEdit() {
  const showToast = useUiStore((s) => s.showToast)
  const editorRef = useRef<RichEditorHandle>(null)
  const params = getCurrentInstance().router?.params
  const editingId = params?.id ? Number(params.id) : null
  const initialNotebookId = params?.notebookId ? Number(params.notebookId) : 0

  const [title, setTitle] = useState('')
  const [mood, setMood] = useState('')
  const [weather, setWeather] = useState('')
  const [notebookId, setNotebookId] = useState(initialNotebookId)
  const [submitting, setSubmitting] = useState(false)

  // 编辑态回填
  useEffect(() => {
    if (!editingId) return
    diaryApi
      .detail(editingId)
      .then((d) => {
        setTitle(d.title || '')
        setMood(d.mood || '')
        setWeather(d.weather || '')
        setNotebookId(d.notebookId || 0)
        setTimeout(() => {
          editorRef.current?.setContents(d.content || '')
        }, 300)
      })
      .catch(() => showToast('载入失败', 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId])

  const submit = async () => {
    if (submitting) return
    if (!useAuthStore.getState().isLogin) {
      showToast('请先登录', 'error')
      return
    }
    const { html, text } = await editorRef.current!.getContents()
    if (!title.trim() || !text.trim()) {
      showToast('标题和正文不能为空', 'info')
      return
    }
    const images = extractImagesInOrder(html)
    const cover = firstImage(html)
    setSubmitting(true)
    try {
      if (editingId) {
        await diaryApi.update(editingId, { title, content: html, cover, mood, weather, notebookId, images })
        showToast('已保存', 'success')
      } else {
        await diaryApi.create({ notebookId, title, content: html, cover, mood, weather, images })
        showToast('已保存', 'success')
      }
      Taro.navigateBack()
    } catch {
      showToast('保存失败，请重试', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageLayout>
      <View className='min-h-screen bg-bg px-6 pt-6'>
        <Input
          className='text-xl text-ink font-bold py-3'
          value={title}
          placeholder='今天想记点什么～'
          onInput={(e) => setTitle(e.detail.value)}
        />
        <MoodWeatherPicker
          mood={mood}
          weather={weather}
          onChange={(m, w) => {
            setMood(m)
            setWeather(w)
          }}
        />
        <RichEditor ref={editorRef} />
        <View
          className={`press bg-peach rounded-pill py-3 mt-8 flex justify-center items-center ${submitting ? 'opacity-50' : ''}`}
          onClick={submit}
        >
          <Text className='text-base text-card'>{submitting ? '保存中…' : '保存'}</Text>
        </View>
      </View>
    </PageLayout>
  )
}
