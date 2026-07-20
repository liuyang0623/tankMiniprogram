import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { PageLayout } from '../../components'
import './fortune.scss'

interface Fortune {
  level: string
  stars: number
  title: string
  desc: string
  tip: string
}

const FORTUNES: Fortune[] = [
  { level: '大吉', stars: 5, title: '心想事成', desc: '今天的你自带好运光环，想做的事不妨大胆去试。', tip: '宜：主动出击 · 忌：犹豫不决' },
  { level: '中吉', stars: 4, title: '稳中向好', desc: '一切都在悄悄变好，保持节奏就会遇见惊喜。', tip: '宜：认真生活 · 忌：熬夜' },
  { level: '小吉', stars: 3, title: '平和顺遂', desc: '平淡也是一种温柔，照顾好自己的心情最重要。', tip: '宜：喝杯热茶 · 忌：钻牛角尖' },
  { level: '末吉', stars: 2, title: '慢慢来', desc: '有点小波折没关系，慢下来反而看得更清楚。', tip: '宜：早点休息 · 忌：勉强自己' },
  { level: '摆烂吉', stars: 3, title: '躺平也很好', desc: '今天允许自己什么都不做，充电也是一种进步。', tip: '宜：放空 · 忌：内耗' },
  { level: '锦鲤', stars: 5, title: '好运连连', desc: '意想不到的好事正在路上，记得对世界温柔一点。', tip: '宜：许愿 · 忌：错过美好' },
]

type Phase = 'idle' | 'shaking' | 'revealed'

export default function FortunePage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<Fortune | null>(null)

  const draw = () => {
    if (phase === 'shaking') return
    setPhase('shaking')
    setResult(null)
    Taro.vibrateShort?.({ type: 'light' } as any).catch(() => {})
    // 摇签动画时长后揭晓
    setTimeout(() => {
      const next = FORTUNES[Math.floor(Math.random() * FORTUNES.length)]
      setResult(next)
      setPhase('revealed')
    }, 650)
  }

  return (
    <PageLayout>
      <View className='fortune-page'>
        <View className='fortune-head anim-in'>
          <Text className='fortune-head__title'>今日运势</Text>
          <Text className='fortune-head__sub'>诚心默念心事，再摇动签筒</Text>
        </View>

        <View className='fortune-stage'>
          {phase !== 'revealed' && (
            <View className={`fortune-cup ${phase === 'shaking' ? 'anim-shake' : ''}`}>
              <Text className='fortune-cup__emoji'>🎋</Text>
              <Text className='fortune-cup__hint'>
                {phase === 'shaking' ? '签文摇曳中…' : '轻触下方按钮抽签'}
              </Text>
            </View>
          )}

          {phase === 'revealed' && result && (
            <View className='fortune-card anim-flip' key={result.title}>
              <Text className='fortune-card__level'>{result.level}</Text>
              <View className='fortune-card__stars'>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Text key={i} className={`fortune-star ${i < result.stars ? 'on' : ''}`}>★</Text>
                ))}
              </View>
              <Text className='fortune-card__title'>{result.title}</Text>
              <Text className='fortune-card__desc'>{result.desc}</Text>
              <View className='fortune-card__tip'>
                <Text className='fortune-card__tip-text'>{result.tip}</Text>
              </View>
            </View>
          )}
        </View>

        <View className='fortune-btn press' onClick={draw}>
          <Text className='fortune-btn__text'>
            {phase === 'idle' ? '摇 签' : phase === 'shaking' ? '摇动中…' : '再摇一次'}
          </Text>
        </View>
      </View>
    </PageLayout>
  )
}
