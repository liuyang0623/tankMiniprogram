import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { logout } from '../../services/auth'
import { useUiStore } from '../../store/ui'

export interface SettingsDrawerProps {
  open: boolean
  onClose: () => void
  /** 退出登录成功后回调（供个人中心清本地态） */
  onLoggedOut?: () => void
}

/** 右滑全屏设置抽屉：主题占位 / 草稿箱 / 退出登录 */
export default function SettingsDrawer({ open, onClose, onLoggedOut }: SettingsDrawerProps) {
  const showToast = useUiStore((s) => s.showToast)

  const goDrafts = () => {
    onClose()
    Taro.navigateTo({ url: '/pages/drafts/index' })
  }

  const onThemeTap = () => {
    showToast('暗黑模式即将上线～', 'info')
  }

  const onLogout = async () => {
    const { confirm } = await Taro.showModal({ title: '退出登录', content: '确定退出当前账号吗？' })
    if (!confirm) return
    logout()
    onClose()
    onLoggedOut?.()
  }

  return (
    <View
      className='fixed'
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        visibility: open ? 'visible' : 'hidden',
      }}
      catchMove={open}
    >
      {/* 遮罩 */}
      <View
        className='fixed'
        style={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.3)',
          opacity: open ? 1 : 0,
          transition: 'opacity .28s ease',
        }}
        onClick={onClose}
      />
      {/* 右侧面板 */}
      <View
        className='fixed bg-bg'
        style={{
          top: 0,
          right: 0,
          bottom: 0,
          width: '80%',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .28s ease',
          zIndex: 101,
        }}
      >
        <View className='px-6 pt-16 pb-8 flex flex-col' style={{ height: '100%' }}>
          {/* 顶部标题 + 关闭 */}
          <View className='flex items-center justify-between mb-8'>
            <Text className='text-lg text-ink font-bold'>设置</Text>
            <View className='press' onClick={onClose}>
              <Text className='text-sm text-ink-sub'>关闭</Text>
            </View>
          </View>

          {/* 主题切换入口（占位禁用态） */}
          <View
            className='press bg-card rounded-card shadow-soft px-4 py-4 mb-4 flex items-center justify-between'
            style={{ opacity: 0.5 }}
            onClick={onThemeTap}
          >
            <Text className='text-base text-ink-sub'>主题切换</Text>
            <Text className='text-xs text-ink-sub'>即将上线</Text>
          </View>

          {/* 草稿箱入口 */}
          <View
            className='press bg-card rounded-card shadow-soft px-4 py-4 mb-4'
            onClick={goDrafts}
          >
            <Text className='text-base text-ink'>草稿箱</Text>
          </View>

          {/* 退出登录（置底） */}
          <View
            className='press mt-auto py-3 flex justify-center items-center rounded-card'
            style={{ border: '1rpx solid #E4A9BE' }}
            onClick={onLogout}
          >
            <Text className='text-sm' style={{ color: '#E4A9BE' }}>
              退出登录
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}
