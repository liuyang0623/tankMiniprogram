import { ReactNode } from 'react'
import { View } from '@tarojs/components'
import { useThemeStore } from '../../store/theme'

/**
 * 主题容器：根 View 挂 theme-{resolved} class，让 CSS 变量在整页子树生效。
 * 用 height:100% + flex column 透传布局，保证内部 ScrollView（100vh/min-h-screen）撑满。
 * 必须包整个页面内容（含 ScrollView 的兄弟节点），否则变量作用域漏。
 */
export default function PageLayout({ children }: { children: ReactNode }) {
  const resolved = useThemeStore((s) => s.resolved)
  return (
    <View
      className={`theme-${resolved}`}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {children}
    </View>
  )
}
