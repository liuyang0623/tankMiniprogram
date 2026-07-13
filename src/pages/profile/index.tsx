import { useEffect, useState, useCallback, useRef } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Avatar, PostCard, SkeletonList, SettingsDrawer, PageLayout } from '../../components'
import { usePagedList } from '../../hooks/usePagedList'
import { postsApi, interactionsApi, usersApi } from '../../services/api'
import { unwrapFavorites } from '../../utils/favorites'
import { useAuthStore } from '../../store/auth'
import { login } from '../../services/auth'
import { useUiStore } from '../../store/ui'
import type { Post, User } from '../../types/api'

type Tab = 'posts' | 'favorites'

export default function Profile() {
  const isLogin = useAuthStore((s) => s.isLogin)
  const showToast = useUiStore((s) => s.showToast)
  const [profile, setProfile] = useState<User | null>(null)
  const [tab, setTab] = useState<Tab>('posts')
  const [scrollTop, setScrollTop] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const loadedTabsRef = useRef<Set<Tab>>(new Set())

  const myPosts = usePagedList<Post>((page) => postsApi.findMyPosts(page))
  const favorites = usePagedList<Post>((page) => interactionsApi.getFavorites(page).then(unwrapFavorites))

  const loadProfile = useCallback(async () => {
    if (!useAuthStore.getState().isLogin) return
    try {
      const p = await usersApi.getProfile()
      setProfile(p)
    } catch {
      // 静默失败，用登录态兜底
    }
  }, [])

  const ensureLoaded = useCallback(
    (t: Tab) => {
      if (!useAuthStore.getState().isLogin || loadedTabsRef.current.has(t)) return
      loadedTabsRef.current.add(t)
      if (t === 'posts') myPosts.reload()
      else favorites.reload()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // 登录态变化：登录则拉资料，登出则清缓存
  useEffect(() => {
    if (isLogin) {
      loadProfile()
      ensureLoaded(tab)
    } else {
      loadedTabsRef.current = new Set()
      setProfile(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLogin])

  // 切 Tab：懒加载对应数据 + 滚动回顶（避免误触发新 Tab loadMore）
  useEffect(() => {
    if (isLogin) {
      ensureLoaded(tab)
      setScrollTop(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  useDidShow(() => {
    // 从编辑页返回后刷新资料
    if (useAuthStore.getState().isLogin) loadProfile()
  })

  const onLogin = async () => {
    try {
      await login()
      loadProfile()
      ensureLoaded(tab)
    } catch (e: any) {
      showToast(e?.message || '登录失败', 'error')
    }
  }

  const handleLoggedOut = () => {
    // 抽屉内部已 logout + 二次确认，这里只清本地列表与资料，回到未登录态
    loadedTabsRef.current = new Set()
    setProfile(null)
    setTab('posts')
  }

  const active = tab === 'posts' ? myPosts : favorites

  const onScrollToLower = () => {
    // 仅登录态、非首屏加载时触发；未登录不请求受保护接口
    if (isLogin) active.loadMore()
  }

  return (
    <PageLayout>
      <ScrollView
        scrollY
        className='bg-bg'
        style={{ height: '100vh' }}
        scrollTop={scrollTop}
        onScrollToLower={onScrollToLower}
        lowerThreshold={80}
      >
      <View className='px-6 pt-16 pb-8'>
        {/* 资料卡 */}
        {isLogin ? (
          <View className='anim-in bg-card rounded-card shadow-soft p-6 flex items-center mb-6'>
            <Avatar src={profile?.avatar} size={112} />
            <View className='ml-4 flex-1'>
              <Text className='text-lg text-ink font-bold'>{profile?.nickname || '摆烂er'}</Text>
              <View className='mt-1'>
                <Text className='text-sm text-ink-sub'>{profile?.bio || '这个人很懒，什么都没写～'}</Text>
              </View>
            </View>
            <View className='flex flex-col items-end'>
              <View
                className='press bg-peach rounded-pill px-4 py-2 mb-2'
                onClick={() => Taro.navigateTo({ url: '/pages/profile-edit/index' })}
              >
                <Text className='text-xs text-card'>编辑</Text>
              </View>
              <View
                className='press bg-card rounded-pill px-4 py-2'
                style={{ border: '1rpx solid #E4A9BE' }}
                onClick={() => setDrawerOpen(true)}
              >
                <Text className='text-xs' style={{ color: '#E4A9BE' }}>设置</Text>
              </View>
            </View>
          </View>
        ) : (
          <View className='anim-in bg-card rounded-card shadow-soft p-6 flex flex-col items-center mb-6'>
            <View className='py-4'>
              <Text className='text-sm text-ink-sub'>登录后查看你的个人空间</Text>
            </View>
            <View className='press bg-peach rounded-pill px-8 py-2' onClick={onLogin}>
              <Text className='text-sm text-card'>微信登录</Text>
            </View>
          </View>
        )}

        {/* Tab */}
        {isLogin && (
          <>
            <View className='flex mb-4'>
              <View className='press mr-6' onClick={() => setTab('posts')}>
                <Text className={tab === 'posts' ? 'text-base text-ink font-bold' : 'text-base text-ink-sub'}>
                  我的帖子
                </Text>
              </View>
              <View className='press' onClick={() => setTab('favorites')}>
                <Text className={tab === 'favorites' ? 'text-base text-ink font-bold' : 'text-base text-ink-sub'}>
                  我的收藏
                </Text>
              </View>
            </View>

            {/* 列表 */}
            {active.loading && active.list.length === 0 && <SkeletonList count={3} />}
            {!active.loading && active.list.length === 0 && (
              <View className='bg-card rounded-card shadow-soft p-6 flex flex-col items-center'>
                <View className='py-6'>
                  <Text className='text-sm text-ink-sub'>
                    {tab === 'posts' ? '还没有发过帖子～' : '还没有收藏～'}
                  </Text>
                </View>
              </View>
            )}
            {active.list.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {active.list.length > 0 && (
              <View className='py-4 flex justify-center items-center'>
                <Text className='text-xs text-ink-sub'>
                  {active.loading ? '加载中…' : active.hasMore ? '上拉加载更多' : '没有更多了'}
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
      <SettingsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLoggedOut={handleLoggedOut}
      />
    </PageLayout>
  )
}
