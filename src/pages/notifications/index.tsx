import { useEffect } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { PageLayout, SkeletonList } from '../../components'
import { useNotificationStore } from '../../store/notification'
import { notificationSummary } from '../../utils/notification'
import { formatRelativeTime } from '../../utils/time'
import type { NotificationItem } from '../../types/notification'

export default function Notifications() {
  const list = useNotificationStore((s) => s.list)
  const loading = useNotificationStore((s) => s.loading)
  const loadList = useNotificationStore((s) => s.loadList)
  const markRead = useNotificationStore((s) => s.markRead)

  // 进入即拉列表 + 整体标记已读（入口红点清零）
  useEffect(() => {
    loadList()
    markRead()
  }, [loadList, markRead])

  const goActor = (n: NotificationItem) => {
    if (!n.actor?.id) return
    Taro.navigateTo({ url: `/pages/user-profile/index?userId=${n.actor.id}` })
  }

  return (
    <PageLayout>
      <ScrollView scrollY className='bg-bg' style={{ height: '100vh' }}>
        <View className='px-4 pt-2 pb-8'>
          {loading && list.length === 0 && <SkeletonList count={5} />}

          {!loading && list.length === 0 && (
            <View className='px-6 pt-10 flex flex-col items-center'>
              <Text className='text-sm text-ink-sub'>还没有通知～</Text>
            </View>
          )}

          {list.map((n) => (
            <View key={n.id} className='flex items-center py-3 px-2'>
              {/* 头像：可点跳主页 */}
              <Image
                src={n.actor.avatar}
                className='w-11 h-11 rounded-full mr-3 flex-shrink-0'
                onClick={() => goActor(n)}
              />
              <View className='flex-1 min-w-0'>
                <Text className='text-sm text-ink-default'>
                  {/* 昵称可点跳主页 */}
                  <Text className='font-medium text-peach' onClick={() => goActor(n)}>
                    {n.actor.nickname || '有人'}
                  </Text>
                  <Text className='text-ink-default'>{notificationSummary(n).replace(n.actor.nickname || '有人', '')}</Text>
                </Text>
                <Text className='text-xs text-ink-sub block mt-1'>{formatRelativeTime(n.createdAt)}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </PageLayout>
  )
}
