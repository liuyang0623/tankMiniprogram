import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { Card, Avatar, Tag, SkeletonList } from '../../components'
import { postsApi } from '../../services/api'
import type { Post } from '../../types/api'

type LoadState = 'loading' | 'success' | 'error'

export default function Index() {
  const [state, setState] = useState<LoadState>('loading')
  const [posts, setPosts] = useState<Post[]>([])

  const load = async () => {
    setState('loading')
    try {
      const res = await postsApi.findAll(1)
      setPosts(res.data || [])
      setState('success')
    } catch {
      // 服务端未启动时会走这里：验证请求层错误处理链路，展示兜底 UI
      setState('error')
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <ScrollView scrollY className='min-h-screen bg-bg'>
      <View className='px-6 pt-16 pb-8'>
        {/* 标题区 */}
        <View className='anim-in mb-6'>
          <Text className='text-2xl text-ink font-bold'>摆烂随笔</Text>
          <View className='mt-2'>
            <Text className='text-sm text-ink-sub'>随手写点不端着的文字 ✍️</Text>
          </View>
        </View>

        {/* 加载态 */}
        {state === 'loading' && <SkeletonList count={3} />}

        {/* 错误兜底 */}
        {state === 'error' && (
          <Card className='items-center'>
            <View className='py-4'>
              <Text className='text-sm text-ink-sub'>内容加载失败，点击重试</Text>
            </View>
            <View className='press bg-peach rounded-pill px-6 py-2' onClick={load}>
              <Text className='text-sm text-card'>重新加载</Text>
            </View>
          </Card>
        )}

        {/* 空态 */}
        {state === 'success' && posts.length === 0 && (
          <Card className='items-center'>
            <View className='py-6'>
              <Text className='text-sm text-ink-sub'>还没有随笔，来写第一篇吧～</Text>
            </View>
          </Card>
        )}

        {/* 信息流 */}
        {state === 'success' &&
          posts.map((post) => (
            <Card key={post.id} float className='mb-4'>
              {/* 作者 */}
              <View className='flex items-center mb-3'>
                <Avatar src={post.author?.avatar} size={64} />
                <View className='ml-3'>
                  <Text className='text-sm text-ink'>{post.author?.name || '匿名'}</Text>
                </View>
              </View>
              {/* 标题与摘要 */}
              <Text className='text-base text-ink font-bold'>{post.title}</Text>
              <View className='mt-1 mb-3'>
                <Text className='text-sm text-ink-sub'>
                  {post.content?.slice(0, 60)}
                  {post.content && post.content.length > 60 ? '…' : ''}
                </Text>
              </View>
              {/* 话题 */}
              {post.topics && post.topics.length > 0 && (
                <View className='flex mb-3'>
                  {post.topics.slice(0, 3).map((t) => (
                    <Tag key={t.id} tone='taro' className='mr-2'>
                      {t.name}
                    </Tag>
                  ))}
                </View>
              )}
              {/* 互动计数 */}
              <View className='flex'>
                <Text className='text-xs text-ink-sub mr-4'>♡ {post.likeCount}</Text>
                <Text className='text-xs text-ink-sub'>💬 {post.commentCount}</Text>
              </View>
            </Card>
          ))}
      </View>
    </ScrollView>
  )
}
