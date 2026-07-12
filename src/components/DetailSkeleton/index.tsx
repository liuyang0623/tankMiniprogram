import { View } from '@tarojs/components'

const SHIMMER_STYLE = {
  background: 'linear-gradient(90deg,#EFE8DE 25%,#F6F1E9 37%,#EFE8DE 63%)',
  backgroundSize: '400% 100%',
  animation: 'shimmer 1.4s ease infinite',
}

/** 详情页结构化骨架：标题条 + 作者行 + 正文块 */
export default function DetailSkeleton() {
  return (
    <View className='anim-in'>
      {/* 标题条 */}
      <View
        className='rounded-card'
        style={{ height: '48rpx', width: '70%', marginBottom: '32rpx', ...SHIMMER_STYLE }}
      />
      {/* 作者行：头像圆 + 昵称条 */}
      <View className='flex items-center' style={{ marginBottom: '32rpx' }}>
        <View style={{ width: '64rpx', height: '64rpx', borderRadius: '50%', ...SHIMMER_STYLE }} />
        <View
          className='rounded-card'
          style={{ height: '28rpx', width: '30%', marginLeft: '24rpx', ...SHIMMER_STYLE }}
        />
      </View>
      {/* 正文块：宽度递减的若干行 */}
      {['100%', '100%', '90%', '95%', '60%'].map((w, i) => (
        <View
          key={i}
          className='rounded-card'
          style={{ height: '28rpx', width: w, marginBottom: '20rpx', ...SHIMMER_STYLE }}
        />
      ))}
    </View>
  )
}
