import { useCallback, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, getCurrentInstance } from '@tarojs/taro'
import { Avatar, PostCard, SkeletonList, PageLayout, FollowButton } from '../../components'
import { usePagedList } from '../../hooks/usePagedList'
import { usersApi } from '../../services/api'
import { useFollowStore } from '../../store/follow'
import { useAuthStore } from '../../store/auth'
import type { Post } from '../../types/api'

/** 单个计数块，可选点击 */
function CountItem({ label, value, onClick }: { label: string; value: number; onClick?: () => void }) {
  return (
    <View className={`flex flex-col items-center px-4 ${onClick ? 'press' : ''}`} onClick={onClick}>
      <Text className='text-lg text-ink font-bold'>{value}</Text>
      <Text className='text-xs text-ink-sub mt-1'>{label}</Text>
    </View>
  )
}

export default function UserProfile() {
  const params = getCurrentInstance().router?.params ?? {}
  const userId = Number(params.userId ?? params.id)

  const currentUserId = useAuthStore((s) => s.user?.id)
  const isSelf = currentUserId != null && currentUserId === userId

  const hydrateUser = useFollowStore((s) => s.hydrateUser)
  const counts = useFollowStore((s) => s.countsMap[userId])
  // 头像/昵称/简介不进 followStore，用局部态承载
  const [meta, setMeta] = useState<{ nickname: string; avatar: string; bio: string }>({
    nickname: '',
    avatar: '',
    bio: '',
  })

  const posts = usePagedList<Post>((page) => usersApi.getUserPosts(userId, page))

  const loadUser = useCallback(async () => {
    if (!Number.isFinite(userId)) return
    try {
      const u = await usersApi.getUser(userId)
      setMeta({ nickname: u.nickname, avatar: u.avatar, bio: u.bio })
      hydrateUser(userId, {
        isFollowing: u.isFollowing ?? false,
        followerCount: u.followerCount ?? 0,
        followingCount: u.followingCount ?? 0,
        likeCount: u.likeCount ?? 0,
      })
    } catch {
      // 静默失败
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  useDidShow(() => {
    if (Number.isFinite(userId)) {
      loadUser()
      posts.reload()
    }
  })

  const goFollowers = () =>
    Taro.navigateTo({ url: `/pages/follow-list/index?userId=${userId}&type=followers` })
  const goFollowing = () =>
    Taro.navigateTo({ url: `/pages/follow-list/index?userId=${userId}&type=following` })

  const onMessage = () => {
    Taro.navigateTo({ url: `/pages/chat/index?userId=${userId}` })
  }

  if (!Number.isFinite(userId)) {
    return (
      <PageLayout>
        <View className='px-6 pt-10 flex justify-center'>
          <Text className='text-sm text-ink-sub'>用户不存在</Text>
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
        onScrollToLower={() => posts.loadMore()}
        lowerThreshold={80}
      >
        <View className='px-6 pt-10 pb-8'>
          {/* 资料头部 */}
          <View className='anim-in bg-card rounded-card shadow-soft p-6 mb-6'>
            <View className='flex items-center'>
              <Avatar src={meta.avatar} size={112} />
              <View className='ml-4 flex-1 min-w-0'>
                <Text className='text-lg text-ink font-bold'>{meta.nickname || '摆烂er'}</Text>
                <View className='mt-1'>
                  <Text className='text-sm text-ink-sub'>{meta.bio || '这个人很懒，什么都没写～'}</Text>
                </View>
              </View>
            </View>

            {/* 三计数 */}
            <View className='flex justify-around mt-5'>
              <CountItem label='获赞' value={counts?.likeCount ?? 0} />
              <CountItem label='粉丝' value={counts?.followerCount ?? 0} onClick={goFollowers} />
              <CountItem label='关注' value={counts?.followingCount ?? 0} onClick={goFollowing} />
            </View>

            {/* 关注 + 私信按钮（非本人才显示） */}
            {!isSelf && (
              <View className='flex mt-5'>
                <FollowButton userId={userId} className='flex-1 mr-3' />
                <View
                  className='press flex-1 inline-flex items-center justify-center rounded-pill px-6 py-2 bg-transparent border border-ink-sub opacity-60'
                  onClick={onMessage}
                >
                  <Text className='text-sm text-ink-sub'>私信</Text>
                </View>
              </View>
            )}
          </View>

          {/* 帖子流 */}
          {posts.loading && posts.list.length === 0 && <SkeletonList count={3} />}
          {!posts.loading && posts.list.length === 0 && (
            <View className='bg-card rounded-card shadow-soft p-6 flex flex-col items-center'>
              <View className='py-6'>
                <Text className='text-sm text-ink-sub'>还没有发布内容～</Text>
              </View>
            </View>
          )}
          {posts.list.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {posts.list.length > 0 && (
            <View className='py-4 flex justify-center items-center'>
              <Text className='text-xs text-ink-sub'>
                {posts.loading ? '加载中…' : posts.hasMore ? '上拉加载更多' : '没有更多了'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </PageLayout>
  )
}
