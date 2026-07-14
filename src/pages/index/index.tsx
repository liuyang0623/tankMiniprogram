import { useEffect, useMemo, useState, useCallback } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import {
  PostCard,
  SkeletonList,
  PageLayout,
  SearchBar,
  CategoryTabs,
  tabToQuery,
  type CategoryTab,
} from '../../components'
import { usePagedList } from '../../hooks/usePagedList'
import { postsApi, categoriesApi } from '../../services/api'
import { useAuthStore } from '../../store/auth'
import type { Post } from '../../types/api'

/** 组装分类 tab：关注(登录才有) + 推荐 + 后端分类 + 其他 */
function buildTabs(categories: { value: string; label: string }[], isLogin: boolean): CategoryTab[] {
  const tabs: CategoryTab[] = []
  if (isLogin) tabs.push({ key: 'following', label: '关注' })
  tabs.push({ key: 'recommend', label: '推荐' })
  categories.forEach((c) => tabs.push({ key: c.value, label: c.label }))
  tabs.push({ key: 'other', label: '其他' })
  return tabs
}

export default function Index() {
  const isLogin = useAuthStore((s) => s.isLogin)
  const [tabs, setTabs] = useState<CategoryTab[]>([])
  const [activeKey, setActiveKey] = useState('recommend') // 默认推荐
  const [keyword, setKeyword] = useState('')

  // 拉分类组装 tab
  useEffect(() => {
    categoriesApi
      .list()
      .then((cats) => setTabs(buildTabs(cats, isLogin)))
      .catch(() => setTabs(buildTabs([], isLogin)))
  }, [isLogin])

  // fetcher 按当前 tab / keyword 构建（follow-list 成熟模式）
  const fetcher = useMemo(
    () => (page: number) => {
      const query = keyword ? { keyword } : tabToQuery(activeKey)
      return postsApi.findAll({ page, limit: 5, ...query })
    },
    [activeKey, keyword],
  )
  const feed = usePagedList<Post>(fetcher)

  // tab / keyword 变化时重新加载
  useEffect(() => {
    feed.reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, keyword])

  const handleSearch = useCallback((kw: string) => {
    setKeyword(kw)
  }, [])

  const handleAdd = useCallback(() => {
    Taro.navigateTo({ url: '/pages/publish/index' })
  }, [])

  const isFirstLoading = feed.loading && feed.list.length === 0

  return (
    <PageLayout>
      <View style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* 顶部：搜索栏 + 分类 tab（固定，不随列表滚动） */}
        <View className='pt-12 bg-bg' style={{ flexShrink: 0 }}>
          <SearchBar onSearch={handleSearch} onAdd={handleAdd} />
          {!keyword && <CategoryTabs tabs={tabs} activeKey={activeKey} onChange={setActiveKey} />}
        </View>

        {/* 文章列表 */}
        <ScrollView
          scrollY
          className='bg-bg'
          style={{ flex: 1, minHeight: 0 }}
          refresherEnabled
          refresherTriggered={feed.refreshing}
          onRefresherRefresh={() => feed.refresh()}
          onScrollToLower={() => feed.loadMore()}
          lowerThreshold={80}
        >
          <View className='px-6 pb-8 pt-2'>
            {isFirstLoading && <SkeletonList count={3} />}

            {feed.error && feed.list.length === 0 && (
              <View className='bg-card rounded-card shadow-soft p-6 flex flex-col items-center'>
                <View className='py-4'>
                  <Text className='text-sm text-ink-sub'>内容加载失败</Text>
                </View>
                <View className='press bg-peach rounded-pill px-6 py-2' onClick={() => feed.reload()}>
                  <Text className='text-sm text-card'>重新加载</Text>
                </View>
              </View>
            )}

            {!isFirstLoading && !feed.error && feed.list.length === 0 && (
              <View className='bg-card rounded-card shadow-soft p-6 flex flex-col items-center'>
                <View className='py-6'>
                  <Text className='text-sm text-ink-sub'>
                    {keyword ? '没有找到相关文章～' : '这里还没有内容～'}
                  </Text>
                </View>
              </View>
            )}

            {feed.list.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {feed.list.length > 0 && (
              <View
                className='press py-4 flex justify-center items-center'
                onClick={() => feed.hasMore && feed.loadMore()}
              >
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
      </View>
    </PageLayout>
  )
}
