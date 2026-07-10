import { View } from '@tarojs/components'

const SHIMMER_STYLE = {
  background: 'linear-gradient(90deg,#EFE8DE 25%,#F6F1E9 37%,#EFE8DE 63%)',
  backgroundSize: '400% 100%',
  animation: 'shimmer 1.4s ease infinite',
}

function Bar({ height = 32, width = '100%' }: { height?: number; width?: string }) {
  return <View className='rounded-card' style={{ height: `${height}rpx`, width, ...SHIMMER_STYLE }} />
}

export interface SkeletonProps {
  rows?: number
}

/** 多行骨架 */
export function Skeleton({ rows = 3 }: SkeletonProps) {
  return (
    <View>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={{ marginBottom: '16rpx' }}>
          <Bar width={i === rows - 1 ? '60%' : '100%'} />
        </View>
      ))}
    </View>
  )
}

/** 列表骨架：多张卡片 */
export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} className='bg-card rounded-card shadow-soft p-6' style={{ marginBottom: '24rpx' }}>
          <Skeleton rows={3} />
        </View>
      ))}
    </View>
  )
}

export default Skeleton
