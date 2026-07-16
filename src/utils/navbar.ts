import Taro from '@tarojs/taro'

export interface NavBarGeom {
  /** 状态栏高度 */
  statusBarHeight: number
  /** 导航栏内容行高（对齐右侧胶囊） */
  navContentHeight: number
  /** 导航栏总高度 = 状态栏 + 内容行（页面内其他元素据此避让） */
  totalHeight: number
  /** 右侧胶囊避让宽度（标题区左右对称留白用） */
  capsuleRight: number
}

/**
 * 计算自定义导航栏几何。CustomNavBar 与需要避让导航栏的组件（如抽屉）共用，
 * 保证高度一致。用 Sync API 一次读取（首屏即需定位，无异步必要），失败给兜底值。
 */
export function getNavBarGeom(): NavBarGeom {
  let statusBarHeight = 20
  let navContentHeight = 44
  let capsuleRight = 10
  try {
    const sys = Taro.getSystemInfoSync()
    statusBarHeight = sys.statusBarHeight ?? 20
    const cap = Taro.getMenuButtonBoundingClientRect()
    const gap = cap.top - statusBarHeight
    navContentHeight = cap.height + gap * 2
    capsuleRight = sys.windowWidth - cap.left
  } catch {
    // 非小程序端或 API 不可用，用兜底值
  }
  return {
    statusBarHeight,
    navContentHeight,
    totalHeight: statusBarHeight + navContentHeight,
    capsuleRight,
  }
}
