import { View, Text } from '@tarojs/components'
import { useUiStore } from '../../store/ui'

const TYPE_CLASS = {
  info: 'bg-ink',
  success: 'bg-peach',
  error: 'bg-heart',
} as const

/** 全局轻提示，由 useUiStore 驱动 */
export default function Toast() {
  const toast = useUiStore((s) => s.toast)
  if (!toast.visible) return null
  return (
    <View
      className={`anim-in ${TYPE_CLASS[toast.type]}`}
      style={{
        position: 'fixed',
        top: '120rpx',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '16rpx 32rpx',
        borderRadius: '999rpx',
        zIndex: 9999,
      }}
    >
      <Text className='text-sm text-card'>{toast.message}</Text>
    </View>
  )
}
