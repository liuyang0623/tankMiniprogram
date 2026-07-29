import { PropsWithChildren } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'
import { useAuthStore } from './store/auth'
import { useThemeStore } from './store/theme'
import { useMessageStore } from './store/message'
import { useNotificationStore } from './store/notification'
import { useAuditStore } from './store/audit'
import Toast from './components/Toast'
import './app.scss'

// 全局错误处理：静默忽略非 tabBar页面的 setTabBarStyle 错误
// 在模块级别注册，仅执行一次
Taro.onError((error: any) => {
  let errorMessage = ''
  if (typeof error === 'string') {
    errorMessage = error
  } else if (error) {
    errorMessage = error.message || error.errmsg || String(error)
  }
  if (errorMessage?.includes('setTabBarStyle:fail not TabBar page')) {
    console.debug('Ignored non-critical tabBar style error:', errorMessage)
    return true
  }
})

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    // 启动时从本地存储恢复登录态（token 未失效时自动登录）
    useAuthStore.getState().restore()

    // 已登录则启动即拉未读（私信 + 系统通知），让消息 tab 红点第一时间显示，
    // 不必等用户点进消息 tab。未登录时跳过，避免请求受保护接口。
    if (useAuthStore.getState().isLogin) {
      useMessageStore.getState().loadConversations()
      useNotificationStore.getState().refreshUnread()
    }

    // 主题初始化：读持久化 mode + 系统主题算 resolved
    let sysTheme: 'light' | 'dark' = 'light'
    try {
      sysTheme = (Taro.getSystemInfoSync().theme as 'light' | 'dark') || 'light'
    } catch {
      sysTheme = 'light'
    }
    useThemeStore.getState().init(sysTheme)

    // 审核模式初始化
    useAuditStore.getState().load()

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
