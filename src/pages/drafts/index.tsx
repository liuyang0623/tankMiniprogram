import { useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { PostCard, SkeletonList } from '../../components'
import { usePagedList } from '../../hooks/usePagedList'
import { postsApi } from '../../services/api'
import { useUiStore } from '../../store/ui'
import type { Post } from '../../types/api'

export default function Drafts() {
  const showToast = useUiStore((s) => s.showToast)
  const { list, loading, hasMore, loadMore, reload, setList } = usePagedList<Post>((page) =>
    postsApi.findDrafts(page),
  )

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openDraft = (id: number) => {
    Taro.navigateTo({ url: `/pages/publish/index?id=${id}` })
  }

  const removeDraft = async (id: number) => {
    const { confirm } = await Taro.showModal({ title: '删除草稿', content: '确定删除这篇草稿吗？' })
    if (!confirm) return
    try {
      await postsApi.remove(id)
      setList((prev) => prev.filter((p) => p.id !== id))
      showToast('已删除', 'success')
    } catch {
      showToast('删除失败', 'error')
    }
  }

  return (
    <ScrollView
      scrollY
      className='bg-bg'
      style={{ height: '100vh' }}
      onScrollToLower={() => loadMore()}
      lowerThreshold={80}
    >
      <View className='px-6 pt-6 pb-8'>
        {loading && list.length === 0 && <SkeletonList count={3} />}
        {!loading && list.length === 0 && (
          <View className='bg-card rounded-card shadow-soft p-6 flex flex-col items-center'>
            <View className='py-6'>
              <Text className='text-sm text-ink-sub'>还没有草稿～</Text>
            </View>
          </View>
        )}
        {list.map((post) => (
          <View key={post.id}>
            <View onClick={() => openDraft(post.id)}>
              <PostCard post={post} />
            </View>
            <View className='flex justify-end px-2 -mt-2 mb-3'>
              <View className='press' onClick={() => removeDraft(post.id)}>
                <Text className='text-xs' style={{ color: '#E4A9BE' }}>
                  删除
                </Text>
              </View>
            </View>
          </View>
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
  )
}
