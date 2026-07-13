import { useEffect, useMemo, useCallback } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { getCurrentInstance } from '@tarojs/taro'
import { FollowUserRow, SkeletonList, PageLayout } from '../../components'
import { usePagedList } from '../../hooks/usePagedList'
import { useFollowStore } from '../../store/follow'
import { useAuthStore } from '../../store/auth'
import type { FollowUserItem } from '../../types/api'
import { normalizeFollowListType, followListTitle, pickFollowFetcher } from './helpers'

export default function FollowList() {
  const params = getCurrentInstance().router?.params ?? {}
  const userId = Number(params.userId)
  const type = normalizeFollowListType(params.type)

  const currentUserId = useAuthStore((s) => s.user?.id)
  const hydrateUser = useFollowStore((s) => s.hydrateUser)

  const fetcher = useMemo(() => pickFollowFetcher(type, userId), [type, userId])
  const { list, loading, hasMore, loadMore, reload } = usePagedList<FollowUserItem>(fetcher)

  // 动态标题
  useEffect(() => {
    Taro.setNavigationBarTitle({ title: followListTitle(type) })
  }, [type])

  // 每次进入刷新（关注状态可能在他页变更）
  useDidShow(() => {
    if (Number.isFinite(userId)) reload()
  })

  // 列表项 isFollowing 同步进全局 store，保证按钮态一致
  const syncToStore = useCallback(
    (items: FollowUserItem[]) => {
      items.forEach((u) => {
        // 仅补充关注状态，计数交给他人主页 hydrate（列表项无计数）
        hydrateUser(u.id, {
          isFollowing: u.isFollowing,
          followerCount: useFollowStore.getState().countsMap[u.id]?.followerCount ?? 0,
          followingCount: useFollowStore.getState().countsMap[u.id]?.followingCount ?? 0,
        })
      })
    },
    [hydrateUser],
  )
  useEffect(() => {
    if (list.length) syncToStore(list)
  }, [list, syncToStore])

  if (!Number.isFinite(userId)) {
    return (
      <PageLayout>
        <View className='px-6 pt-10 flex justify-center'>
          <Text className='text-sm text-ink-sub'>参数错误</Text>
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
        onScrollToLower={() => loadMore()}
        lowerThreshold={80}
      >
        <View className='px-6 pt-6 pb-8'>
          {loading && list.length === 0 && <SkeletonList count={4} />}
          {!loading && list.length === 0 && (
            <View className='bg-card rounded-card shadow-soft p-6 flex flex-col items-center'>
              <View className='py-6'>
                <Text className='text-sm text-ink-sub'>
                  {type === 'following' ? '还没有关注任何人～' : '还没有粉丝～'}
                </Text>
              </View>
            </View>
          )}
          {list.map((u) => (
            <FollowUserRow key={u.id} user={u} currentUserId={currentUserId} />
          ))}
          {list.length > 0 && (
            <View className='py-4 flex justify-center items-center'>
              <Text className='text-xs text-ink-sub'>
                {loading ? '加载中…' : hasMore ? '上拉加载更多' : '没有更多了'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </PageLayout>
  )
}
