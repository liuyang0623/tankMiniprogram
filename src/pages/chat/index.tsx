import { useEffect, useRef, useState, useCallback } from 'react'
import { View, Text, ScrollView, Image, Input } from '@tarojs/components'
import Taro, { getCurrentInstance } from '@tarojs/taro'
import { PageLayout, SkeletonList } from '../../components'
import { usePagedList } from '../../hooks/usePagedList'
import { useMessageStore } from '../../store/message'
import { useAuthStore } from '../../store/auth'
import { sendMessage, getMessages, findConversation } from '../../services/message'
import { usersApi, uploadApi } from '../../services/api'
import type { MessageItem } from '../../types/api'

export default function Chat() {
  const params = getCurrentInstance().router?.params ?? {}
  const paramConvId = Number(params.conversationId)
  const paramUserId = Number(params.userId)
  const currentUserId = useAuthStore((s) => s.user?.id)

  // 会话 id：会话列表入口直接带；主页入口先查后端，无会话则首条消息后由后端返回
  const [conversationId, setConversationId] = useState<number>(
    Number.isFinite(paramConvId) ? paramConvId : 0,
  )
  // 接收方 userId：主页入口直接带；会话列表入口从会话信息反查
  const [targetUserId, setTargetUserId] = useState<number>(
    Number.isFinite(paramUserId) ? paramUserId : 0,
  )

  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [extraMessages, setExtraMessages] = useState<MessageItem[]>([])
  const scrollViewRef = useRef<any>(null)
  const shouldScrollBottom = useRef(true)

  const fetcher = useCallback(
    (page: number) => getMessages(conversationId, page),
    [conversationId],
  )
  const { list, loading, hasMore, loadMore, reload } = usePagedList<MessageItem>(fetcher)

  // 主页入口：先查是否已有会话，有则设置 conversationId 加载历史
  useEffect(() => {
    if (paramUserId > 0 && !Number.isFinite(paramConvId)) {
      findConversation(paramUserId)
        .then((res) => {
          if (res.conversationId > 0) setConversationId(res.conversationId)
        })
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 有 conversationId 时拉历史 + 标记已读（usePagedList 不自动首屏）
  useEffect(() => {
    if (conversationId > 0) {
      reload()
      useMessageStore.getState().markRead(conversationId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  // 设置对方昵称为导航标题（两种入口都需要）
  useEffect(() => {
    // 优先用 targetUserId；会话列表入口从会话信息反查对方 id
    let uid = targetUserId
    if (uid === 0 && conversationId > 0) {
      const conv = useMessageStore.getState().conversations.find((c) => c.id === conversationId)
      uid = conv?.otherUser.id ?? 0
      if (conv) {
        Taro.setNavigationBarTitle({ title: conv.otherUser.nickname || '聊天' })
        if (targetUserId === 0) setTargetUserId(uid)
        return
      }
    }
    if (uid > 0) {
      usersApi
        .getUser(uid)
        .then((u) => Taro.setNavigationBarTitle({ title: u.nickname || '聊天' }))
        .catch(() => {})
    }
  }, [targetUserId, conversationId])

  // 有历史/新消息时滚动到底部
  useEffect(() => {
    if ((list.length > 0 || extraMessages.length > 0) && shouldScrollBottom.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo?.({ top: 999999, animated: false })
      }, 100)
    }
  }, [list, extraMessages])

  // 订阅全局 message store：当前会话来了新消息则追加
  useEffect(() => {
    const unsub = useMessageStore.subscribe((state) => {
      const latest = state.lastIncoming
      if (latest && latest.conversationId === conversationId && latest.senderId !== currentUserId) {
        setExtraMessages((prev) =>
          prev.some((m) => m.id === latest.id) ? prev : [...prev, latest],
        )
        shouldScrollBottom.current = true
        if (conversationId > 0) useMessageStore.getState().markRead(conversationId)
      }
    })
    return unsub
  }, [conversationId, currentUserId])

  const resolveToUserId = useCallback((): number => {
    if (targetUserId > 0) return targetUserId
    const conv = useMessageStore.getState().conversations.find((c) => c.id === conversationId)
    return conv?.otherUser.id ?? 0
  }, [targetUserId, conversationId])

  const doSend = useCallback(
    async (content: string, type: 'text' | 'image') => {
      const toUserId = resolveToUserId()
      if (!toUserId || !currentUserId) {
        Taro.showToast({ title: '无法确定接收方', icon: 'none' })
        return
      }
      setSending(true)
      try {
        const msg = await sendMessage(toUserId, content, type)
        if (conversationId === 0 && msg.conversationId) {
          setConversationId(msg.conversationId)
        }
        setExtraMessages((prev) => [...prev, msg])
        shouldScrollBottom.current = true
      } catch (e: any) {
        Taro.showToast({ title: e?.message || '发送失败', icon: 'none' })
      } finally {
        setSending(false)
      }
    },
    [resolveToUserId, currentUserId, conversationId],
  )

  const sendText = useCallback(() => {
    const text = inputText.trim()
    if (!text || sending) return
    setInputText('')
    doSend(text, 'text')
  }, [inputText, sending, doSend])

  const pickImage = useCallback(async () => {
    if (sending) return
    try {
      const res = await Taro.chooseImage({ count: 1, sizeType: ['compressed'] })
      const filePath = res.tempFilePaths?.[0]
      if (!filePath) return
      Taro.showLoading({ title: '上传中…' })
      const { url } = await uploadApi.uploadImage(filePath)
      Taro.hideLoading()
      await doSend(url, 'image')
    } catch (e: any) {
      Taro.hideLoading()
      if (e?.errMsg && !e.errMsg.includes('cancel')) {
        Taro.showToast({ title: '图片发送失败', icon: 'none' })
      }
    }
  }, [sending, doSend])

  const handleInput = useCallback((e: any) => {
    setInputText(e.detail.value)
  }, [])

  if (conversationId === 0 && targetUserId === 0) {
    return (
      <PageLayout>
        <View className='px-6 pt-10 flex justify-center'>
          <Text className='text-sm text-ink-sub'>参数错误</Text>
        </View>
      </PageLayout>
    )
  }

  const allMessages = [...list, ...extraMessages]

  return (
    <PageLayout>
      <View style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* 消息列表 */}
        <ScrollView
          scrollY
          className='bg-bg'
          style={{ flex: 1, minHeight: 0 }}
          onScrollToUpper={() => {
            shouldScrollBottom.current = false
            if (conversationId > 0 && hasMore && !loading) loadMore()
          }}
          upperThreshold={80}
          scrollWithAnimation
          ref={scrollViewRef}
        >
          <View className='px-4 pt-4 pb-4'>
            {loading && list.length === 0 && <SkeletonList count={5} />}

            {list.length > 0 && hasMore && (
              <View className='py-2 flex justify-center'>
                <Text className='text-xs text-ink-sub'>上拉加载更多</Text>
              </View>
            )}

            {allMessages.map((msg) => {
              const isSelf = msg.senderId === currentUserId
              return (
                <View
                  key={msg.id}
                  className={`flex mb-3 ${isSelf ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.type === 'image' ? (
                    <Image
                      src={msg.content}
                      className='rounded-lg'
                      style={{ width: '160px' }}
                      mode='widthFix'
                      onClick={() => Taro.previewImage({ urls: [msg.content] })}
                    />
                  ) : (
                    <View
                      className={`max-w-[70%] px-3 py-2 rounded-2xl shadow-sm ${
                        isSelf ? 'bg-peach' : 'bg-card'
                      }`}
                    >
                      <Text className={`text-sm leading-relaxed ${isSelf ? 'text-white' : 'text-ink'}`}>
                        {msg.content}
                      </Text>
                    </View>
                  )}
                </View>
              )
            })}

            {!loading && allMessages.length === 0 && (
              <View className='pt-10 flex justify-center'>
                <Text className='text-sm text-ink-sub'>开始对话吧～</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* 输入区：输入框 + 加号按钮 */}
        <View
          className='flex items-center px-3 py-2 bg-card border-t border-card-soft'
          style={{ flexShrink: 0, paddingBottom: 'calc(8px + env(safe-area-inset-bottom))' }}
        >
          <Input
            className='flex-1 h-9 rounded-full bg-bg px-3 text-sm text-ink'
            placeholderClass='text-ink-sub'
            placeholder='输入消息…'
            value={inputText}
            onInput={handleInput}
            confirmType='send'
            onConfirm={sendText}
          />
          {inputText.trim() ? (
            <View
              className='press ml-2 h-9 px-4 rounded-full bg-peach flex items-center justify-center'
              onClick={sendText}
            >
              <Text className='text-white text-sm font-medium'>发送</Text>
            </View>
          ) : (
            <View
              className='press ml-2 w-9 h-9 rounded-full bg-bg flex items-center justify-center'
              onClick={pickImage}
            >
              <Text className='text-ink-sub text-xl leading-none'>＋</Text>
            </View>
          )}
        </View>
      </View>
    </PageLayout>
  )
}
