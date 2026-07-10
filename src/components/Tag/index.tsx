import { View, Text } from '@tarojs/components'
import type { ReactNode } from 'react'

type Tone = 'peach' | 'taro' | 'haze'

// 浅底 + 深字，保持治愈系柔和观感
const TONE_CLASS: Record<Tone, string> = {
  peach: 'bg-peach text-card',
  taro: 'bg-taro text-card',
  haze: 'bg-haze text-card',
}

export interface TagProps {
  tone?: Tone
  className?: string
  children: ReactNode
}

/** 话题/分类标签 */
export default function Tag({ tone = 'peach', className = '', children }: TagProps) {
  return (
    <View className={`inline-flex items-center px-3 py-1 rounded-pill ${TONE_CLASS[tone]} ${className}`}>
      <Text className='text-xs'>{children}</Text>
    </View>
  )
}
