import Taro from '@tarojs/taro'
import type { Resolved } from './theme'

/** 两套 tabBar 配色（原生 tabBar 不受 CSS 变量控制，需运行时 API 应用） */
const TABBAR_STYLE: Record<Resolved, Taro.setTabBarStyle.Option> = {
  light: {
    color: '#8A7F76',
    selectedColor: '#F0A868',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
  },
  dark: {
    color: '#A89E93',
    selectedColor: '#F0A868',
    backgroundColor: '#26201B',
    borderStyle: 'black',
  },
}

/** 按解析后的主题应用原生 tabBar 配色；失败静默（部分页面无 tabBar 时 API 会报错） */
export function applyTabBarStyle(resolved: Resolved): void {
  try {
    Taro.setTabBarStyle(TABBAR_STYLE[resolved])
  } catch {
    // 当前页无 tabBar 或 API 不可用时忽略
  }
}

/** 两套导航栏配色（原生 header 不受 CSS 变量控制；文字色仅支持 black/white） */
const NAVBAR_STYLE: Record<Resolved, { backgroundColor: string; frontColor: '#ffffff' | '#000000' }> = {
  light: { backgroundColor: '#FAF6F0', frontColor: '#000000' },
  dark: { backgroundColor: '#1A1613', frontColor: '#ffffff' },
}

/** 按主题应用当前页导航栏配色（页面级 API，需每页进入时调用）；失败静默 */
export function applyNavBarColor(resolved: Resolved): void {
  try {
    Taro.setNavigationBarColor(NAVBAR_STYLE[resolved])
  } catch {
    // API 不可用时忽略
  }
}

