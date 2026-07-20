import { useState, useRef } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { PageLayout } from '../../components'
import './food.scss'

interface Dish {
  name: string
  emoji: string
  cat: string
}

const DISHES: Dish[] = [
  { name: '番茄炒蛋盖饭', emoji: '🍅', cat: '中餐' },
  { name: '黄焖鸡米饭', emoji: '🍗', cat: '中餐' },
  { name: '兰州拉面', emoji: '🍜', cat: '中餐' },
  { name: '麻辣香锅', emoji: '🌶️', cat: '中餐' },
  { name: '螺蛳粉', emoji: '🥢', cat: '中餐' },
  { name: '寿司拼盘', emoji: '🍣', cat: '日韩' },
  { name: '石锅拌饭', emoji: '🍲', cat: '日韩' },
  { name: '牛肉汉堡', emoji: '🍔', cat: '西餐' },
  { name: '意大利面', emoji: '🍝', cat: '西餐' },
  { name: '披萨', emoji: '🍕', cat: '西餐' },
  { name: '轻食沙拉', emoji: '🥗', cat: '轻食' },
  { name: '关东煮', emoji: '🍢', cat: '轻食' },
]

const CATS = ['全部', '中餐', '日韩', '西餐', '轻食']

export default function FoodPage() {
  const [cat, setCat] = useState('全部')
  const [current, setCurrent] = useState<Dish | null>(null)
  const [rolling, setRolling] = useState(false)
  const [rollName, setRollName] = useState<Dish | null>(null)
  const timer = useRef<any>(null)

  const pool = cat === '全部' ? DISHES : DISHES.filter((d) => d.cat === cat)

  const pick = () => {
    if (rolling) return
    setRolling(true)
    setCurrent(null)
    let ticks = 0
    const total = 14 + Math.floor(Math.random() * 6)
    clearInterval(timer.current)
    timer.current = setInterval(() => {
      setRollName(pool[Math.floor(Math.random() * pool.length)])
      ticks += 1
      if (ticks >= total) {
        clearInterval(timer.current)
        const final = pool[Math.floor(Math.random() * pool.length)]
        setCurrent(final)
        setRollName(null)
        setRolling(false)
        Taro.vibrateShort?.({ type: 'light' } as any).catch(() => {})
      }
    }, 80)
  }

  const onCat = (c: string) => {
    if (rolling) return
    setCat(c)
    setCurrent(null)
  }

  return (
    <PageLayout>
      <View className='food-page'>
        <View className='food-head anim-in'>
          <Text className='food-head__title'>今天吃什么</Text>
          <Text className='food-head__sub'>把选择交给一点点随机的浪漫</Text>
        </View>

        <View className='food-cats'>
          {CATS.map((c) => (
            <View
              key={c}
              className={`food-cat press ${cat === c ? 'on' : ''}`}
              onClick={() => onCat(c)}
            >
              <Text className='food-cat__text'>{c}</Text>
            </View>
          ))}
        </View>

        <View className='food-stage'>
          {rolling && rollName && (
            <View className='food-result rolling'>
              <Text className='food-result__emoji'>{rollName.emoji}</Text>
              <Text className='food-result__name'>{rollName.name}</Text>
            </View>
          )}
          {!rolling && current && (
            <View className='food-result anim-slot' key={current.name}>
              <Text className='food-result__emoji'>{current.emoji}</Text>
              <Text className='food-result__name'>{current.name}</Text>
              <Text className='food-result__cat'>{current.cat}</Text>
            </View>
          )}
          {!rolling && !current && (
            <View className='food-empty'>
              <Text className='food-empty__emoji'>🍽️</Text>
              <Text className='food-empty__text'>点下方按钮，让缘分决定这一餐</Text>
            </View>
          )}
        </View>

        <View className='food-btn press' onClick={pick}>
          <Text className='food-btn__text'>{rolling ? '选择中…' : current ? '换一个' : '帮我决定'}</Text>
        </View>
      </View>
    </PageLayout>
  )
}
