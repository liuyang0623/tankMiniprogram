import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { logout } from '../../services/auth'
import { usersApi } from '../../services/api/users'
import { SUBSCRIBE_TPL_FOLLOW } from '../../config/env'
import { useThemeStore } from '../../store/theme'
import Iconfont from '../Iconfont'
import type { Mode } from '../../utils/theme'

export interface SettingsDrawerProps {
  open: boolean
  onClose: () => void
  /** 退出登录成功后回调（供个人中心清本地态） */
  onLoggedOut?: () => void
}

const THEME_OPTIONS: { label: string; value: Mode }[] = [
  { label: '亮', value: 'light' },
  { label: '暗', value: 'dark' },
  { label: '跟随系统', value: 'system' },
]

/** 右滑全屏设置抽屉：主题三选 / 草稿箱 / 退出登录 */
export default function SettingsDrawer({ open, onClose, onLoggedOut }: SettingsDrawerProps) {
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)

  const goDrafts = () => {
    onClose()
    Taro.navigateTo({ url: '/pages/drafts/index' })
  }

  const onLogout = async () => {
    const { confirm } = await Taro.showModal({ title: '退出登录', content: '确定退出当前账号吗？' })
    if (!confirm) return
    logout()
    onClose()
    onLoggedOut?.()
  }

  // 开启关注提醒：拉起微信订阅授权 → 用户同意后上报后端累加可推送配额。
  // 微信订阅是「一次授权一次配额」制，无法回读授权状态，故做成行动按钮而非受控开关。
  const onEnableFollowNotify = async () => {
    let res: Record<string, string>
    try {
      // Taro 类型把 entityIds 标为必填（实为一次性消息可选字段），断言绕过。
      res = (await Taro.requestSubscribeMessage({
        tmplIds: [SUBSCRIBE_TPL_FOLLOW],
      } as Taro.requestSubscribeMessage.Option)) as unknown as Record<string, string>
    } catch (e) {
      console.error('[关注提醒] requestSubscribeMessage 失败:', e)
      Taro.showToast({ title: '授权拉起失败', icon: 'none' })
      return
    }
    console.log('[关注提醒] 授权结果:', res)
    if (res[SUBSCRIBE_TPL_FOLLOW] !== 'accept') {
      Taro.showToast({ title: '已取消', icon: 'none' })
      return
    }
    try {
      await usersApi.reportSubscribeFollow()
      Taro.showToast({ title: '已开启关注提醒', icon: 'success' })
    } catch (e) {
      console.error('[关注提醒] 上报后端失败:', e)
      Taro.showToast({ title: '上报失败，请重试', icon: 'none' })
    }
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
        <View className='px-6 pt-8 pb-8 flex flex-col' style={{ height: '100%' }}>
          {/* 顶部标题 + 关闭 */}
          <View className='flex items-center justify-between mb-8'>
            <Text className='text-lg text-ink font-bold'>设置</Text>
            <View className='press flex items-center justify-center' onClick={onClose}>
              <Iconfont name='guanbi_o' size={22} color='#8a7f76' />
            </View>
          </View>

          {/* 主题三选 */}
          <View className='bg-card rounded-card shadow-soft px-4 py-4 mb-4'>
            <Text className='text-base text-ink'>主题</Text>
            <View className='flex mt-3'>
              {THEME_OPTIONS.map((opt) => {
                const activeItem = mode === opt.value
                return (
                  <View
                    key={opt.value}
                    className={`press rounded-pill px-4 py-2 mr-3 ${activeItem ? 'bg-peach' : 'bg-card-soft'}`}
                    onClick={() => setMode(opt.value)}
                  >
                    <Text className={`text-sm ${activeItem ? 'text-card' : 'text-ink-sub'}`}>
                      {opt.label}
                    </Text>
                  </View>
                )
              })}
            </View>
          </View>

          {/* 草稿箱入口 */}
          <View className='press bg-card rounded-card shadow-soft px-4 py-4 mb-4' onClick={goDrafts}>
            <Text className='text-base text-ink'>草稿箱</Text>
          </View>

          {/* 关注提醒授权 */}
          <View
            className='press bg-card rounded-card shadow-soft px-4 py-4 mb-4 flex items-center justify-between'
            onClick={onEnableFollowNotify}
          >
            <View className='flex flex-col'>
              <Text className='text-base text-ink'>关注提醒</Text>
              <Text className='text-xs text-ink-sub mt-1'>有人关注你时收到微信通知</Text>
            </View>
            <Iconfont name='jiantou_liebiaoxiangyou' size={18} color='#c9bfb6' />
          </View>

          {/* 退出登录（置底） */}
          <View
            className='press mt-auto py-3 flex justify-center items-center rounded-card'
            style={{ border: '1rpx solid var(--c-taro)' }}
            onClick={onLogout}
          >
            <Text className='text-sm' style={{ color: 'var(--c-taro)' }}>
              退出登录
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}
