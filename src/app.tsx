import { PropsWithChildren } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'
import { useAuthStore } from './store/auth'
import { useThemeStore } from './store/theme'
import { useMessageStore } from './store/message'
import { useNotificationStore } from './store/notification'
import { useAuditStore } from './store/audit'
import Toast from './components/Toast'
import './app.scss'

function App({ children }: PropsWithChildren) {
  useLaunch(async () => {
    // 启动时从本地存储恢复登录态（token 未失效时自动登录）
    useAuthStore.getState().restore()

    // 拉取全局配置，决定是否进入审核模式（隐藏首页/消息 tab、灵感解惑）。
    // 失败降级为正常模式，不阻塞启动。
    await useAuditStore.getState().load()
    const { auditMode } = useAuditStore.getState()

    // 已登录且非审核模式才启动即拉未读（私信 + 系统通知），让消息 tab 红点第一时间
    // 显示。审核模式下消息 tab 隐藏，跳过以免请求无处展示。
    if (!auditMode && useAuthStore.getState().isLogin) {
      useMessageStore.getState().loadConversations()
      useNotificationStore.getState().refreshUnread()
    }

    // 审核模式下首页 tab 被隐藏，但启动仍落在首页（pages 列表第一项），
    // 重定向到日记，避免停留在无对应 tab 的页面。
    if (auditMode) {
      Taro.switchTab({ url: '/pages/diary/index' })
    }

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
