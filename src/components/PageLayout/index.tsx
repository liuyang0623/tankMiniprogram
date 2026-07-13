import { ReactNode, useEffect } from 'react'
import { View } from '@tarojs/components'
import { useDidShow } from '@tarojs/taro'
import { useThemeStore } from '../../store/theme'
import { applyNavBarColor } from '../../utils/tabbar'

/**
 * 主题容器：根 View 挂 theme-{resolved} class，让 CSS 变量在整页子树生效。
 * 用 height:100% + flex column 透传布局，保证内部 ScrollView（100vh/min-h-screen）撑满。
 * 必须包整个页面内容（含 ScrollView 的兄弟节点），否则变量作用域漏。
 * 原生导航栏不受 CSS 变量控制，用 setNavigationBarColor 页面级 API 应用。
 */
export default function PageLayout({ children }: { children: ReactNode }) {
  const resolved = useThemeStore((s) => s.resolved)

  // 停留当前页切换主题：即时更新导航栏
  useEffect(() => {
    applyNavBarColor(resolved)
  }, [resolved])

  // navigateTo/切回页面：页面显示时导航栏已渲染，此时应用才可靠
  // （useEffect 挂载时导航栏原生组件可能未就绪，setNavigationBarColor 会被忽略）
  useDidShow(() => {
    applyNavBarColor(resolved)
  })

  return (
    <View
      className={`theme-${resolved}`}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {children}
    </View>
  )
}
