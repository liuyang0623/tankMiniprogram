import { useEffect, useRef, useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro, { getCurrentInstance } from '@tarojs/taro'
import RichEditor, { RichEditorHandle } from '../../components/RichEditor'
import { firstImage, parseTopics, extractImagesInOrder } from '../../utils/publish'
import { postsApi } from '../../services/api'
import { useAuthStore } from '../../store/auth'
import { login } from '../../services/auth'
import { useUiStore } from '../../store/ui'
import type { PostStatus } from '../../types/api'

export default function Publish() {
  const showToast = useUiStore((s) => s.showToast)
  const editorRef = useRef<RichEditorHandle>(null)
  const [title, setTitle] = useState('')
  const [topicInput, setTopicInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // 编辑态：url ?id= 存在
  const idParam = getCurrentInstance().router?.params?.id
  const editingId = idParam ? Number(idParam) : null
  // 载入的原帖状态：编辑已发布帖子时用于保持 PUBLISHED
  const origStatusRef = useRef<PostStatus | null>(null)

  // 未登录拦截：进入即校验
  useEffect(() => {
    if (!useAuthStore.getState().isLogin) {
      login().catch((e: any) => {
        showToast(e?.message || '请先登录', 'error')
      })
    }
  }, [showToast])

  // 编辑态载入回填
  useEffect(() => {
    if (!editingId) return
    postsApi
      .findOne(editingId)
      .then((p) => {
        setTitle(p.title || '')
        origStatusRef.current = p.status
        setTopicInput((p.topics || []).map((t) => `#${t.name}`).join(' '))
        // 编辑器 ready 后回填（延迟确保 ctx 就绪）
        setTimeout(() => editorRef.current?.setContents(p.content || ''), 300)
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
    const topics = parseTopics(`${title} ${topicInput}`)
    const images = extractImagesInOrder(html)
    const cover = firstImage(html)
    setSubmitting(true)
    try {
      if (editingId) {
        // 编辑态：已发布不传 status 保持 PUBLISHED；草稿更新后再发布
        if (origStatusRef.current === 'PUBLISHED') {
          await postsApi.update(editingId, { title, content: html, cover, images, topics })
        } else {
          await postsApi.update(editingId, { title, content: html, cover, images, topics })
          await postsApi.publish(editingId)
        }
        showToast('已保存', 'success')
        Taro.navigateBack()
      } else {
        const post = await postsApi.create({
          title,
          content: html,
          cover,
          images,
          topics,
          status: 'PUBLISHED',
        })
        showToast('发布成功', 'success')
        Taro.redirectTo({ url: `/pages/detail/index?id=${post.id}` })
      }
    } catch {
      showToast('发布失败，请重试', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className='min-h-screen bg-bg px-6 pt-6'>
      <Input
        className='text-xl text-ink font-bold py-3'
        value={title}
        placeholder='起个标题吧～'
        onInput={(e) => setTitle(e.detail.value)}
      />
      <RichEditor ref={editorRef} />
      <View className='mt-4'>
        <Text className='text-xs text-ink-sub'>话题（用 #话题 形式，空格分隔）</Text>
        <Input
          className='mt-2 text-base text-ink'
          value={topicInput}
          placeholder='#摆烂 #周末'
          onInput={(e) => setTopicInput(e.detail.value)}
        />
      </View>
      <View
        className={`press bg-peach rounded-pill py-3 mt-8 flex justify-center items-center ${submitting ? 'opacity-50' : ''}`}
        onClick={submit}
      >
        <Text className='text-base text-card'>
          {submitting ? '提交中…' : editingId ? '保存' : '发布'}
        </Text>
      </View>
    </View>
  )
}
