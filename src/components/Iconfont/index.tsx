import { Image } from '@tarojs/components'
import { ICONS, type IconName } from './icons'

export type { IconName }

interface IconfontProps {
  /** 图标名（icons.ts 中的 key，如 'bianji' / 'sousuo'） */
  name: IconName
  /** 尺寸，px，默认 20 */
  size?: number
  /** 颜色，具体色值（hex/rgb），默认奶橘 #f0a868。注意：不支持 CSS 变量 */
  color?: string
  /** 额外类名 */
  className?: string
  /** 点击事件 */
  onClick?: () => void
}

/**
 * 单色 iconfont 图标组件。
 * 运行时把图标 path 拼成完整 svg 字符串（注入 fill 颜色）→ svg data-uri
 * → Image 渲染。weapp 不支持内联 <svg>，用 data-uri 是最稳的跨端方式。
 *
 * 注意：data-uri svg 脱离 DOM 上下文，CSS 变量/currentColor 不生效，
 * 必须传具体色值（hex/rgb）。图标颜色不随亮暗主题自动切换。
 *
 * 图标数据来自 src/components/Iconfont/icons.ts（由 scripts/gen-icons.mjs 生成）。
 */
export default function Iconfont({
  name,
  size = 20,
  color = '#f0a868',
  className = '',
  onClick,
}: IconfontProps) {
  const icon = ICONS[name]
  if (!icon) return null

  const paths = icon.paths.map((d) => `<path d="${d}" fill="${color}"/>`).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox}" width="${size}" height="${size}">${paths}</svg>`
  // encodeURIComponent 比 base64 对 weapp 更稳，且支持 currentColor 外的颜色
  const src = `data:image/svg+xml,${encodeURIComponent(svg)}`

  return (
    <Image
      src={src}
      className={className}
      style={{ width: `${size}px`, height: `${size}px` }}
      onClick={onClick}
    />
  )
}
