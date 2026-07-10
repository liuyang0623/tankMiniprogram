import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import { useAuthStore } from './store/auth'
import Toast from './components/Toast'
import './app.scss'

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    // 启动时从本地存储恢复登录态（token 未失效时自动登录）
    useAuthStore.getState().restore()
  })

  return (
    <>
      {children}
      <Toast />
    </>
  )
}

export default App
