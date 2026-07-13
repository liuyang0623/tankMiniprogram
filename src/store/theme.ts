import { create } from 'zustand'
import Taro from '@tarojs/taro'
import { resolveTheme, type Mode, type Resolved } from '../utils/theme'
import { applyTabBarStyle } from '../utils/tabbar'

const MODE_KEY = 'theme-mode'

interface ThemeState {
  mode: Mode
  resolved: Resolved
  /** 用户手选模式：存内存 + 持久化 + 用系统主题重算 resolved */
  setMode: (m: Mode) => void
  /** onThemeChange 回调：system 模式下跟随系统更新 resolved */
  applySystem: (sysTheme: Resolved) => void
  /** 启动初始化：读持久化 mode（默认 system），用系统主题算 resolved */
  init: (sysTheme: Resolved) => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'system',
  resolved: 'light',

  setMode: (m) => {
    const sys = getSystemTheme()
    const resolved = resolveTheme(m, sys)
    Taro.setStorageSync(MODE_KEY, m)
    set({ mode: m, resolved })
    applyTabBarStyle(resolved)
  },

  applySystem: (sysTheme) => {
    if (get().mode === 'system') {
      set({ resolved: sysTheme })
      applyTabBarStyle(sysTheme)
    }
  },

  init: (sysTheme) => {
    const stored = (Taro.getStorageSync(MODE_KEY) as Mode) || 'system'
    const resolved = resolveTheme(stored, sysTheme)
    set({ mode: stored, resolved })
    applyTabBarStyle(resolved)
  },
}))

/** 读当前系统主题，缺省按 light */
function getSystemTheme(): Resolved {
  try {
    return (Taro.getSystemInfoSync().theme as Resolved) || 'light'
  } catch {
    return 'light'
  }
}
