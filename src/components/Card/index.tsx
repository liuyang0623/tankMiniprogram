import { View } from '@tarojs/components'
import type { ReactNode } from 'react'

export interface CardProps {
  /** 是否带进场动效 */
  float?: boolean
  className?: string
  onClick?: () => void
  children: ReactNode
}

/** 圆角柔和阴影卡片，可选进场动效 */
export default function Card({ float, className = '', onClick, children }: CardProps) {
  return (
    <View
      className={`relative bg-card rounded-card shadow-soft p-6 ${float ? 'anim-in' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </View>
  )
}
