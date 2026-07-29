import { useEffect, useRef, useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro, { getCurrentInstance } from '@tarojs/taro'
import RichEditor, { RichEditorHandle } from '../../components/RichEditor'
import { PageLayout, MoodWeatherPicker } from '../../components'
import { firstImage, extractImagesInOrder } from '../../utils/publish'
import { diaryApi } from '../../services/api'
import { useAuthStore } from '../../store/auth'

export default function DiaryEdit() {
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
      .catch(() => Taro.showToast({ title: '载入失败', icon: 'error' }))
  }, [editingId, diaryApi])

  const submit = async () => {
    if (submitting) return

    // ① 先校验登录态
    if (!useAuthStore.getState().isLogin) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    // ② 同步校验标题（绝不依赖异步操作）
    if (!title.trim()) {
      Taro.showToast({ title: '标题不能为空', icon: 'none' })
      return
    }

    // ③ 检查编辑器是否就绪
    if (!editorRef.current) {
      console.error('Editor ref not mounted!')
      Taro.showToast({ title: '编辑器未就绪', icon: 'error' })
      return
    }

    // ④ 再获取正文内容
    try {
      const { html, text } = await editorRef.current.getContents()

      // 同步校验正文
      if (!text.trim()) {
        Taro.showToast({ title: '正文内容不能为空', icon: 'none' })
        return
      }

      const images = extractImagesInOrder(html)
      const cover = firstImage(html)
      setSubmitting(true)

      if (editingId) {
        await diaryApi.update(editingId, { title, content: html, cover, mood, weather, notebookId, images })
        Taro.showToast({ title: '已保存', icon: 'success' })
      } else {
        await diaryApi.create({ notebookId, title, content: html, cover, mood, weather, images })
        Taro.showToast({ title: '已保存', icon: 'success' })
      }
      Taro.navigateBack()
    } catch (e) {
      console.error('Save error:', e)
      Taro.showToast({ title: '保存失败', icon: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageLayout>
      <View className='min-h-screen bg-bg px-6 pt-6'>
        <Input
          className='text-xl text-ink font-bold'
          style={{ height: '96rpx', lineHeight: '96rpx' }}
          value={title}
          placeholder='今天想记点什么～'
          adjustPosition={false}
          cursorSpacing={0}
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