import { View } from '@tarojs/components'
import type { ReactNode } from 'react'

export interface TransitionProps {
  className?: string
  children: ReactNode
}

/** 进场过渡包装：淡入上浮 */
export default function Transition({ className = '', children }: TransitionProps) {
  return <View className={`anim-in ${className}`}>{children}</View>
}
