import { View, Text, ScrollView } from '@tarojs/components'
import { PostCard, SkeletonList } from '../../components'
import { usePagedList } from '../../hooks/usePagedList'
import { postsApi } from '../../services/api'
import type { Post } from '../../types/api'
import { useEffect } from 'react'

export default function Index() {
  const feed = usePagedList<Post>((page) => postsApi.findAll(page, 5))

  useEffect(() => {
    feed.reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isFirstLoading = feed.loading && feed.list.length === 0

  return (
    <ScrollView
      scrollY
      className='min-h-screen bg-bg'
      refresherEnabled
      refresherTriggered={feed.refreshing}
      onRefresherRefresh={() => feed.refresh()}
      onScrollToLower={() => feed.loadMore()}
      lowerThreshold={80}
    >
      <View className='px-6 pt-16 pb-8'>
        {/* 标题区 */}
        <View className='anim-in mb-6'>
          <Text className='text-2xl text-ink font-bold'>摆烂随笔</Text>
          <View className='mt-2'>
            <Text className='text-sm text-ink-sub'>随手写点不端着的文字 ✍️</Text>
          </View>
        </View>

        {/* 首屏加载态 */}
        {isFirstLoading && <SkeletonList count={3} />}

        {/* 错误兜底 */}
        {feed.error && feed.list.length === 0 && (
          <View className='bg-card rounded-card shadow-soft p-6 items-center'>
            <View className='py-4'>
              <Text className='text-sm text-ink-sub'>内容加载失败</Text>
            </View>
            <View className='press bg-peach rounded-pill px-6 py-2' onClick={() => feed.reload()}>
              <Text className='text-sm text-card'>重新加载</Text>
            </View>
          </View>
        )}

        {/* 空态 */}
        {!isFirstLoading && !feed.error && feed.list.length === 0 && (
          <View className='bg-card rounded-card shadow-soft p-6 items-center'>
            <View className='py-6'>
              <Text className='text-sm text-ink-sub'>还没有随笔，来写第一篇吧～</Text>
            </View>
          </View>
        )}

        {/* 信息流 */}
        {feed.list.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {/* 加载更多/到底提示 */}
        {feed.list.length > 0 && (
          <View className='press py-4 items-center' onClick={() => feed.hasMore && feed.loadMore()}>
            <Text className='text-xs text-ink-sub'>
              {feed.loading
                ? '加载中…'
                : feed.error
                  ? '加载失败，点击重试'
                  : feed.hasMore
                    ? '上拉加载更多'
                    : '没有更多了'}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}
