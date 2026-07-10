import { View, Text } from '@tarojs/components'
import { Button, Card, Avatar, Tag, SkeletonList } from '../../components'

export default function Index() {
  return (
    <View className='min-h-screen bg-bg px-6 pt-16'>
      {/* 标题区 */}
      <View className='anim-in mb-8'>
        <Text className='text-2xl text-ink font-bold'>摆烂随笔</Text>
        <View className='mt-2'>
          <Text className='text-sm text-ink-sub'>随手写点不端着的文字 ✍️</Text>
        </View>
      </View>

      {/* 组件展示卡片 */}
      <Card float className='mb-4'>
        <View className='flex items-center mb-4'>
          <Avatar size={72} />
          <View className='ml-3'>
            <Text className='text-base text-ink'>治愈系设计系统</Text>
          </View>
        </View>
        <View className='flex mb-4'>
          <Tag tone='peach' className='mr-2'>随笔</Tag>
          <Tag tone='taro' className='mr-2'>摆烂</Tag>
          <Tag tone='haze'>日常</Tag>
        </View>
        <View className='flex'>
          <Button type='primary' className='mr-3'>主按钮</Button>
          <Button type='ghost'>次按钮</Button>
        </View>
      </Card>

      {/* 骨架屏展示 */}
      <SkeletonList count={2} />
    </View>
  )
}
