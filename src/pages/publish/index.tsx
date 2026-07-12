import { useEffect, useRef, useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro, { getCurrentInstance, useUnload } from '@tarojs/taro'
import RichEditor, { RichEditorHandle } from '../../components/RichEditor'
import { firstImage, parseTopics, extractImagesInOrder } from '../../utils/publish'
import { postsApi } from '../../services/api'
import { useAuthStore } from '../../store/auth'
import { login } from '../../services/auth'
import { useUiStore } from '../../store/ui'
import { useDraftAutosave } from '../../hooks/useDraftAutosave'
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
  // 供自动保存取快照（正文异步取，缓存最近一次 getContents 结果）
  const lastHtmlRef = useRef('')
  const lastTextRef = useRef('')
  // 回填 gate：编辑态载入回填未完成前，不触发自动保存（避免用空 html 覆盖草稿）
  const backfillingRef = useRef<boolean>(!!(idParam ? Number(idParam) : null))

  const draft = useDraftAutosave({
    editingId,
    getSnapshot: () => ({
      title,
      html: lastHtmlRef.current,
      text: lastTextRef.current,
      topics: parseTopics(`${title} ${topicInput}`),
    }),
  })

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
        // 编辑器 ready 后回填（延迟确保 ctx 就绪），回填完成才解除 gate
        setTimeout(() => {
          editorRef.current?.setContents(p.content || '')
          lastHtmlRef.current = p.content || ''
          lastTextRef.current = (p.content || '').replace(/<[^>]+>/g, '')
          backfillingRef.current = false
        }, 300)
      })
      .catch(() => {
        backfillingRef.current = false
        showToast('载入失败', 'error')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId])

  // 编辑器内容变化：取内容缓存后触发 debounce 保存
  const onEditorInput = async () => {
    if (backfillingRef.current) return
    const { html, text } = await editorRef.current!.getContents()
    lastHtmlRef.current = html
    lastTextRef.current = text
    draft.schedule()
  }

  // 标题/话题变化也触发保存（回填期间不触发）
  useEffect(() => {
    if (backfillingRef.current) return
    if (title || topicInput) draft.schedule()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, topicInput])

  // 离开页面兜底 flush
  useUnload(() => {
    void draft.flush()
  })

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
    lastHtmlRef.current = html
    lastTextRef.current = text
    draft.cancel()
    // flush 串行等待在飞的自动保存 settle，并返回最终草稿 id（避免读到过期的 state）
    const flushedId = await draft.flush()
    const topics = parseTopics(`${title} ${topicInput}`)
    const images = extractImagesInOrder(html)
    const cover = firstImage(html)
    const targetId = editingId ?? flushedId
    setSubmitting(true)
    try {
      if (targetId) {
        // 已发布不传 status 保持 PUBLISHED；草稿更新后再发布
        if (origStatusRef.current === 'PUBLISHED') {
          await postsApi.update(targetId, { title, content: html, cover, images, topics })
        } else {
          await postsApi.update(targetId, { title, content: html, cover, images, topics })
          await postsApi.publish(targetId)
        }
        showToast(editingId ? '已保存' : '发布成功', 'success')
        if (editingId) Taro.navigateBack()
        else Taro.redirectTo({ url: `/pages/detail/index?id=${targetId}` })
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
      {/* 保存状态字 */}
      <View className='flex justify-end py-1'>
        <Text className='text-xs text-ink-sub'>
          {draft.status === 'saving' ? '保存中…' : draft.status === 'saved' ? '草稿已保存' : ''}
        </Text>
      </View>
      <Input
        className='text-xl text-ink font-bold py-3'
        value={title}
        placeholder='起个标题吧～'
        onInput={(e) => setTitle(e.detail.value)}
      />
      <RichEditor ref={editorRef} onInput={onEditorInput} />
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
