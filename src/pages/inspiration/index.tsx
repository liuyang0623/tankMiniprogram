import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { PageLayout } from '../../components'
import './index.scss'
import { useIsAuditMode } from '../../hooks/useAuditGuard'

interface Section {
  key: string
  title: string
  desc: string
  emoji: string
  url: string
  accent: string
}

const SECTIONS: Section[] = [
  { key: 'fortune', title: '测运势', desc: '摇一签，看看今天的运气', emoji: '🔮', url: '/pages/inspiration/fortune', accent: 'var(--c-taro)' },
  { key: 'food', title: '今天吃什么', desc: '选择困难？交给缘分', emoji: '🍜', url: '/pages/inspiration/food', accent: 'var(--c-peach)' },
  { key: 'sport', title: '运动计划', desc: '每天一点点，坚持有回响', emoji: '🏃', url: '/pages/inspiration/sport', accent: 'var(--c-heart)' },
  // QA 模块在审核模式下被移除
]

export default function InspirationIndex() {
  const isAuditMode = useIsAuditMode()

  // 过滤掉 QA 板块（审核模式下）
  const displaySections = SECTIONS.filter(s => s.key !== 'qa')

  const go = (url: string) => Taro.navigateTo({ url })

  return (
    <PageLayout>
      <View className='insp-page'>
        <View className='insp-hero anim-in'>
          <Text className='insp-hero__title'>给生活一点灵感</Text>
          <Text className='insp-hero__sub'>四个小角落，随手玩一玩</Text>
        </View>

        <View className='insp-grid'>
          {displaySections.map((s, i) => (
            <View
              key={s.key}
              className='insp-card press anim-stagger'
              style={{ animationDelay: `${i * 90}ms` }}
              onClick={() => go(s.url)}
            >
              <View className='insp-card__icon' style={{ background: s.accent }}>
                <Text className='insp-card__emoji'>{s.emoji}</Text>
              </View>
              <View className='insp-card__body'>
                <Text className='insp-card__title'>{s.title}</Text>
                <Text className='insp-card__desc'>{s.desc}</Text>
              </View>
              <Text className='insp-card__arrow'>›</Text>
            </View>
          ))}
        </View>
      </View>
    </PageLayout>
  )
}
