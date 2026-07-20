import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { PageLayout } from '../../components'
import './index.scss'

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
  { key: 'qa', title: '解惑', desc: '把困惑说出来，听听大家的', emoji: '💬', url: '/pages/inspiration/qa', accent: 'var(--c-haze)' },
  { key: 'sport', title: '运动计划', desc: '每天一点点，坚持有回响', emoji: '🏃', url: '/pages/inspiration/sport', accent: 'var(--c-heart)' },
]

export default function InspirationIndex() {
  const go = (url: string) => Taro.navigateTo({ url })

  return (
    <PageLayout>
      <View className='insp-page'>
        <View className='insp-hero anim-in'>
          <Text className='insp-hero__title'>给生活一点灵感</Text>
          <Text className='insp-hero__sub'>四个小角落，随手玩一玩</Text>
        </View>

        <View className='insp-grid'>
          {SECTIONS.map((s, i) => (
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
