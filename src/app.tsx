import { PropsWithChildren } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'
import { useAuthStore } from './store/auth'
import { useThemeStore } from './store/theme'
import Toast from './components/Toast'
import './app.scss'

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    // 启动时从本地存储恢复登录态（token 未失效时自动登录）
    useAuthStore.getState().restore()

    // 主题初始化：读持久化 mode + 系统主题算 resolved
    let sysTheme: 'light' | 'dark' = 'light'
    try {
      sysTheme = (Taro.getSystemInfoSync().theme as 'light' | 'dark') || 'light'
    } catch {
      sysTheme = 'light'
    }
    useThemeStore.getState().init(sysTheme)

    // app 级只注册一次：system 模式跟随系统深浅色实时切换
    Taro.onThemeChange(({ theme }) => {
      useThemeStore.getState().applySystem(theme as 'light' | 'dark')
    })
  })

  return (
    <>
      {children}
      <Toast />
    </>
  )
}

export default App
