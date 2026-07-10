import { View, Text } from '@tarojs/components'

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

      {/* 设计系统验证卡片 */}
      <View className='anim-in bg-card rounded-card shadow-soft p-6 mb-4'>
        <Text className='text-base text-ink'>温柔治愈系 · 设计系统就绪</Text>
        <View className='flex mt-4'>
          <View className='w-12 h-12 rounded-pill bg-peach mr-3' />
          <View className='w-12 h-12 rounded-pill bg-taro mr-3' />
          <View className='w-12 h-12 rounded-pill bg-haze' />
        </View>
      </View>
    </View>
  )
}
