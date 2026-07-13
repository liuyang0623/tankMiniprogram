import { useEffect, useCallback } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { PageLayout, SkeletonList } from '../../components'
import { useMessageStore } from '../../store/message'
import { useAuthStore } from '../../store/auth'
import type { ConversationItem } from '../../types/api'

/** 简洁时间格式化 */
function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  // 今天内显示 HH:mm
  if (diff < 86400000 && d.getDate() === now.getDate()) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  // 昨天
  if (diff < 172800000 && d.getDate() === now.getDate() - 1) {
    return '昨天'
  }
  // 今年内 月/日
  if (d.getFullYear() === now.getFullYear()) {
    return `${d.getMonth() + 1}/${d.getDate()}`
  }
  // 跨年
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

/** 消息摘要截断（纯文本截取，图片显示"[图片]"） */
function messagePreview(content: string): string {
  return content || '[图片]'
}

export default function Messages() {
  const conversations = useMessageStore((s) => s.conversations)
  const loaded = useMessageStore((s) => s.loaded)
  const loading = useMessageStore((s) => s.loading)
  const loadConversations = useMessageStore((s) => s.loadConversations)
  const isLogin = useAuthStore((s) => s.isLogin)

  // 首次加载
  useEffect(() => {
    if (isLogin && !loaded) {
      loadConversations()
    }
  }, [isLogin, loaded, loadConversations])

  // 每次进入刷新
  useDidShow(() => {
    if (isLogin) loadConversations()
  })

  const goChat = useCallback((conv: ConversationItem) => {
    Taro.navigateTo({ url: `/pages/chat/index?conversationId=${conv.id}` })
  }, [])

  // 未登录
  if (!isLogin) {
    return (
      <PageLayout>
        <View className='px-6 pt-10 flex justify-center'>
          <Text className='text-sm text-ink-sub'>登录后可查看消息</Text>
        </View>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <ScrollView
        scrollY
        className='bg-bg'
        style={{ height: '100vh' }}
        refresherEnabled
        onRefresherRefresh={() => loadConversations()}
      >
        <View className='px-4 pt-2 pb-8'>
          {/* 加载态 */}
          {loading && !loaded && <SkeletonList count={5} />}

          {/* 空态 */}
          {loaded && conversations.length === 0 && (
            <View className='px-6 pt-10 flex flex-col items-center'>
              <Text className='text-sm text-ink-sub'>还没有消息～</Text>
            </View>
          )}

          {/* 会话列表 */}
          {conversations.map((conv) => (
            <View
              key={conv.id}
              className='flex items-center py-3 px-2 active:bg-gray-50 rounded-xl'
              onClick={() => goChat(conv)}
            >
              {/* 头像 */}
              <Image
                src={conv.otherUser.avatar}
                className='w-12 h-12 rounded-full mr-3 flex-shrink-0'
              />
              {/* 内容区 */}
              <View className='flex-1 min-w-0'>
                <View className='flex items-center justify-between'>
                  <Text className='text-sm font-medium text-ink-default truncate max-w-[180px]'>
                    {conv.otherUser.nickname}
                  </Text>
                  <Text className='text-xs text-ink-sub'>{formatTime(conv.lastTime)}</Text>
                </View>
                <View className='flex items-center mt-1'>
                  <Text className='text-xs text-ink-sub truncate flex-1'>
                    {messagePreview(conv.lastMessage)}
                  </Text>
                  {conv.unreadCount > 0 && (
                    <View className='ml-2 min-w-[18px] h-[18px] rounded-full bg-red-500 flex items-center justify-center px-1'>
                      <Text className='text-white text-[10px] font-bold'>
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </PageLayout>
  )
}