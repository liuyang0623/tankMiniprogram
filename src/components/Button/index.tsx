import { View } from '@tarojs/components'
import type { ReactNode } from 'react'

type ButtonType = 'primary' | 'ghost' | 'pill'

const TYPE_CLASS: Record<ButtonType, string> = {
  primary: 'bg-peach text-card',
  ghost: 'bg-transparent text-ink border border-ink-sub',
  pill: 'bg-taro text-card rounded-pill',
}

export interface ButtonProps {
  type?: ButtonType
  disabled?: boolean
  className?: string
  onClick?: () => void
  children: ReactNode
}

/** 基础按钮：按压有 scale 反馈，遵循设计 token */
export default function Button({ type = 'primary', disabled, className = '', onClick, children }: ButtonProps) {
  const base = 'press inline-flex items-center justify-center px-6 py-3 rounded-card text-base'
  const state = disabled ? 'opacity-50' : ''
  return (
    <View
      className={`${base} ${TYPE_CLASS[type]} ${state} ${className}`}
      onClick={() => {
        if (!disabled) onClick?.()
      }}
    >
      {children}
    </View>
  )
}
