import { Image, View } from '@tarojs/components'

export interface AvatarProps {
  src?: string
  /** 直径，单位 rpx */
  size?: number
  className?: string
}

/** 圆形头像，无图时用雾霾蓝占位 */
export default function Avatar({ src, size = 80, className = '' }: AvatarProps) {
  const style = { width: `${size}rpx`, height: `${size}rpx` }
  if (!src) {
    return <View className={`rounded-pill bg-haze ${className}`} style={style} />
  }
  return (
    <Image
      className={`rounded-pill bg-haze ${className}`}
      style={style}
      src={src}
      mode='aspectFill'
    />
  )
}
