import { useEffect, useCallback } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { PageLayout, SkeletonList, Iconfont } from '../../components'
import { useMessageStore } from '../../store/message'
import { useNotificationStore } from '../../store/notification'
import { useAuthStore } from '../../store/auth'
import type { ConversationItem } from '../../types/api'
import { notificationSummary } from '../../utils/notification'

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

/** 消息摘要：空或图片 URL 显示"[图片]"，否则显示文本 */
function messagePreview(content: string): string {
  if (!content) return '[图片]'
  if (/^https?:\/\/\S+\.(png|jpe?g|gif|webp|bmp)/i.test(content)) return '[图片]'
  return content
}

export default function Messages() {
  const conversations = useMessageStore((s) => s.conversations)
  const loaded = useMessageStore((s) => s.loaded)
  const loading = useMessageStore((s) => s.loading)
  const loadConversations = useMessageStore((s) => s.loadConversations)
  const isLogin = useAuthStore((s) => s.isLogin)
  const notifUnread = useNotificationStore((s) => s.unreadCount)
  const notifLatest = useNotificationStore((s) => s.latest)
  const refreshUnread = useNotificationStore((s) => s.refreshUnread)

  // 首次加载
  useEffect(() => {
    if (isLogin && !loaded) {
      loadConversations()
    }
  }, [isLogin, loaded, loadConversations])

  // 每次进入刷新（会话 + 系统通知未读）
  useDidShow(() => {
    if (isLogin) {
      loadConversations()
      refreshUnread()
    }
  })

  const goChat = useCallback((conv: ConversationItem) => {
    Taro.navigateTo({ url: `/pages/chat/index?conversationId=${conv.id}` })
  }, [])

  const goNotifications = useCallback(() => {
    Taro.navigateTo({ url: '/pages/notifications/index' })
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
          {/* 系统通知聚合入口：常驻置顶，不随会话排序 */}
          <View
            className='flex items-center py-3 px-2 active:bg-gray-50 rounded-xl'
            onClick={goNotifications}
          >
            <View
              className='w-12 h-12 rounded-full mr-3 flex-shrink-0 flex items-center justify-center'
              style={{ background: 'rgba(240,168,104,0.15)' }}
            >
              <Iconfont name='xiaoxi_o' size={24} color='#f0a868' />
            </View>
            <View className='flex-1 min-w-0'>
              <View className='flex items-center justify-between'>
                <Text className='text-sm font-medium text-ink-default'>系统通知</Text>
                {notifUnread > 0 && (
                  <View
                    className='rounded-full flex items-center justify-center flex-shrink-0'
                    style={{ background: '#ef8a7f', minWidth: '32rpx', height: '32rpx', paddingLeft: '8rpx', paddingRight: '8rpx' }}
                  >
                    <Text className='text-card' style={{ fontSize: '20rpx' }}>
                      {notifUnread > 99 ? '99+' : notifUnread}
                    </Text>
                  </View>
                )}
              </View>
              <Text className='text-xs text-ink-sub truncate block mt-1'>
                {notifLatest ? notificationSummary(notifLatest) : '暂无通知'}
              </Text>
            </View>
          </View>

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