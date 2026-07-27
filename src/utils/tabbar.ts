import Taro from '@tarojs/taro'
import type { Resolved } from './theme'

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

