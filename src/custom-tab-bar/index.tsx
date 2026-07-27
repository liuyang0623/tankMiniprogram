import { useState } from 'react'
import { View, Image, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useAuditStore } from '../store/audit'
import { useThemeStore } from '../store/theme'
import { useMessageStore } from '../store/message'
import { useNotificationStore } from '../store/notification'
import type { Resolved } from '../utils/theme'
import './index.scss'

import homeIcon from '../assets/tabbar/home.png'
import homeActive from '../assets/tabbar/home-active.png'
import diaryIcon from '../assets/tabbar/diary.png'
import diaryActive from '../assets/tabbar/diary-active.png'
import inspirationIcon from '../assets/tabbar/inspiration.png'
import inspirationActive from '../assets/tabbar/inspiration-active.png'
import messageIcon from '../assets/tabbar/message.png'
import messageActive from '../assets/tabbar/message-active.png'
import profileIcon from '../assets/tabbar/profile.png'
import profileActive from '../assets/tabbar/profile-active.png'

interface TabItem {
  key: string
  pagePath: string
  text: string
  icon: string
  activeIcon: string
  /** 审核模式下隐藏（首页、消息） */
  auditHidden?: boolean
}

const TABS: TabItem[] = [
  { key: 'home', pagePath: '/pages/index/index', text: '首页', icon: homeIcon, activeIcon: homeActive, auditHidden: true },
  { key: 'diary', pagePath: '/pages/diary/index', text: '日记', icon: diaryIcon, activeIcon: diaryActive },
  { key: 'inspiration', pagePath: '/pages/inspiration/index', text: '灵感', icon: inspirationIcon, activeIcon: inspirationActive },
  { key: 'message', pagePath: '/pages/messages/index', text: '消息', icon: messageIcon, activeIcon: messageActive, auditHidden: true },
  { key: 'profile', pagePath: '/pages/profile/index', text: '我的', icon: profileIcon, activeIcon: profileActive },
]

/** 两套配色，与 utils/tabbar.ts 的导航栏配色主题保持一致 */
const COLORS: Record<Resolved, { color: string; selected: string; bg: string; border: string }> = {
  light: { color: '#8A7F76', selected: '#F0A868', bg: '#FFFFFF', border: '#EFE7DD' },
  dark: { color: '#A89E93', selected: '#F0A868', bg: '#26201B', border: '#3A322B' },
}

/** 读取当前页面栈栈顶路由，统一补前导斜杠；取不到时返回空串 */
function currentRoute(): string {
  const pages = Taro.getCurrentPages()
  const route = pages[pages.length - 1]?.route
  if (!route) return ''
  return route.startsWith('/') ? route : `/${route}`
}

/** 自定义 tabBar：审核模式下只渲染 日记/灵感/我的，隐藏首页与消息 */
export default function CustomTabBar() {
  const auditMode = useAuditStore((s) => s.auditMode)
  const resolved = useThemeStore((s) => s.resolved)
  // 消息 tab 角标：私信未读 + 系统通知未读，原生 setTabBarBadge 对自定义 tabBar 无效，
  // 改由组件订阅两个 store 自行渲染红点。
  const dmUnread = useMessageStore((s) => s.unreadTotal)
  const notifUnread = useNotificationStore((s) => s.unreadCount)
  const messageBadge = dmUnread + notifUnread
  // 惰性初始化：首帧直接读页面栈栈顶，避免初次进入短暂无高亮
  const [selected, setSelected] = useState(() => currentRoute())

  // 每次页面显示时同步当前路由为选中态（switchTab 后 tabBar 会重挂/显示）。
  // 自定义 tabBar 是组件，getCurrentInstance().router 指向组件初始实例（首页），
  // 会导致选中态始终停在首页；改用页面栈栈顶的 route 才是真实当前页。
  useDidShow(() => {
    setSelected(currentRoute())
  })

  const tabs = auditMode ? TABS.filter((t) => !t.auditHidden) : TABS
  const c = COLORS[resolved]

  const onTap = (path: string) => {
    if (path === selected) return
    Taro.switchTab({ url: path })
  }

  return (
    <View
      className='custom-tab-bar'
      style={{ backgroundColor: c.bg, borderTop: `1rpx solid ${c.border}` }}
    >
      {tabs.map((t) => {
        const active = selected === t.pagePath
        const showBadge = t.key === 'message' && messageBadge > 0
        return (
          <View key={t.key} className='custom-tab-bar__item press' onClick={() => onTap(t.pagePath)}>
            <View className='custom-tab-bar__icon-wrap'>
              <Image className='custom-tab-bar__icon' src={active ? t.activeIcon : t.icon} />
              {showBadge && (
                <View className='custom-tab-bar__badge'>
                  <Text className='custom-tab-bar__badge-text'>
                    {messageBadge > 99 ? '99+' : messageBadge}
                  </Text>
                </View>
              )}
            </View>
            <Text className='custom-tab-bar__text' style={{ color: active ? c.selected : c.color }}>
              {t.text}
            </Text>
          </View>
        )
      })}
    </View>
  )
}
