import { useMemo } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import Iconfont from '../Iconfont'
import './index.scss'

interface Props {
  /** 标题文字（当前日记本名） */
  title: string
  /** 抽屉是否展开：控制箭头方向（展开时朝上收起，收起时朝下下拉） */
  arrowOpen?: boolean
  /** 点击标题区回调 */
  onTitleTap: () => void
}

/**
 * 自定义导航栏（仅 diary/index 用，页面需配 navigationStyle: custom）。
 *
 * 三处适配（微信小程序自绘导航栏标准做法）：
 * 1. 顶部留状态栏高度占位（statusBarHeight）。
 * 2. 内容行高度/垂直位置对齐右侧胶囊按钮（getMenuButtonBoundingClientRect），
 *    标题区左右留出对称避让，避免被胶囊遮挡。
 * 3. 背景/文字用主题 CSS 变量（--c-bg / --c-ink / --c-ink-sub），
 *    故本组件必须渲染在 PageLayout 的 .theme-* 子树内，变量才生效。
 *
 * 几何数据用 Sync API 一次读取（导航栏在首屏即需定位，无异步必要）。
 */
export default function CustomNavBar({ title, arrowOpen = false, onTitleTap }: Props) {
  const geom = useMemo(() => {
    let statusBarHeight = 20
    let navContentHeight = 44
    let capsuleRight = 10
    try {
      const sys = Taro.getSystemInfoSync()
      statusBarHeight = sys.statusBarHeight ?? 20
      const cap = Taro.getMenuButtonBoundingClientRect()
      // 内容行高 = 胶囊高 + 上下对称间距（胶囊 top 到状态栏底的距离 ×2）
      const gap = cap.top - statusBarHeight
      navContentHeight = cap.height + gap * 2
      // 右侧避让：胶囊左缘到屏幕右缘的距离，标题区两侧各留这么宽保持居中
      capsuleRight = sys.windowWidth - cap.left
    } catch {
      // 非小程序端或 API 不可用，用兜底值
    }
    return { statusBarHeight, navContentHeight, capsuleRight }
  }, [])

  return (
    <View
      className='custom-nav'
      style={{ paddingTop: `${geom.statusBarHeight}px` }}
    >
      <View
        className='custom-nav__bar'
        style={{
          height: `${geom.navContentHeight}px`,
          paddingLeft: `${geom.capsuleRight}px`,
          paddingRight: `${geom.capsuleRight}px`,
        }}
      >
        <View className='custom-nav__title' onClick={onTitleTap}>
          <Text className='custom-nav__name'>{title}</Text>
          <Iconfont
            name={arrowOpen ? 'jiantou_liebiaoshouqi' : 'jiantou_liebiaozhankai'}
            size={18}
            color='#8a7f76'
            className='custom-nav__arrow'
          />
        </View>
      </View>
    </View>
  )
}
