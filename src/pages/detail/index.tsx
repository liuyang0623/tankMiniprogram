import { useEffect, useState } from 'react'
import { View, Text, RichText, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { Avatar, Tag, DetailSkeleton, InteractionBar, CommentList, PageLayout } from '../../components'
import { postsApi } from '../../services/api'
import { extractImageUrls } from '../../utils/richtext'
import type { Post } from '../../types/api'
import './index.scss'

type LoadState = 'loading' | 'success' | 'error'

export default function Detail() {
  const router = useRouter()
  const id = Number(router.params.id)
  const [state, setState] = useState<LoadState>('loading')
  const [post, setPost] = useState<Post | null>(null)

  const load = async () => {
    if (!id) {
      setState('error')
      return
    }
    setState('loading')
    try {
      const res = await postsApi.findOne(id)
      setPost(res)
      setState('success')
    } catch {
      setState('error')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const previewImages = () => {
    if (!post?.content) return
    const urls = extractImageUrls(post.content)
    if (urls.length > 0) {
      Taro.previewImage({ current: urls[0], urls })
    }
  }

  return (
    <PageLayout>
      <ScrollView scrollY className='min-h-screen bg-bg'>
      <View className='px-6 pt-12 pb-10'>
        {state === 'loading' && (
          <View className='bg-card rounded-card shadow-soft p-6'>
            <DetailSkeleton />
          </View>
        )}

        {state === 'error' && (
          <View className='bg-card rounded-card shadow-soft p-6 items-center'>
            <View className='py-4'>
              <Text className='text-sm text-ink-sub'>文章加载失败</Text>
            </View>
            <View className='press bg-peach rounded-pill px-6 py-2' onClick={load}>
              <Text className='text-sm text-card'>重新加载</Text>
            </View>
          </View>
        )}

        {state === 'success' && post && (
          <View className='anim-in'>
            {/* 标题 */}
            <Text className='text-2xl text-ink font-bold'>{post.title}</Text>

            {/* 作者与计数 */}
            <View className='flex items-center mt-4 mb-4'>
              <View
                className='press flex items-center'
                onClick={() => {
                  if (post.author?.id != null) {
                    Taro.navigateTo({ url: `/pages/user-profile/index?id=${post.author.id}` })
                  }
                }}
              >
                <Avatar src={post.author?.avatar} size={64} />
                <View className='ml-3'>
                  <Text className='text-sm text-ink'>{post.author?.name || '匿名'}</Text>
                </View>
              </View>
              <View className='ml-auto'>
                <Text className='text-xs text-ink-sub'>阅读 {post.viewCount}</Text>
              </View>
            </View>

            {/* 话题 */}
            {post.topics && post.topics.length > 0 && (
              <View className='flex mb-4'>
                {post.topics.map((t) => (
                  <Tag key={t.id} tone='taro' className='mr-2'>
                    {t.name}
                  </Tag>
                ))}
              </View>
            )}

            {/* 富文本正文，点击图片预览 */}
            <View className='rich-body' onClick={previewImages}>
              <RichText nodes={post.content || ''} />
            </View>

            {/* 互动栏 */}
            <InteractionBar
              postId={post.id}
              initialLiked={!!post.isLiked}
              initialFavorited={!!post.isFavorited}
              initialLikeCount={post.likeCount}
            />

            {/* 评论区 */}
            <CommentList postId={post.id} />
          </View>
        )}
      </View>
    </ScrollView>
    </PageLayout>
  )
}
