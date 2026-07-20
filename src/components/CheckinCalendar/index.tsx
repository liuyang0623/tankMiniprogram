import { View, Text } from '@tarojs/components'
import { useMemo } from 'react'
import { buildMonthGrid, shiftMonth, toDateKey } from './calendar'
import './index.scss'

interface Props {
  year: number
  month: number // 1-12
  dates: string[] // 当月已打卡 YYYY-MM-DD
  loading?: boolean
  onMonthChange: (year: number, month: number) => void
}

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六']

/** 打卡日历：自绘 7 列月历，区分 已打卡 / 缺卡 / 今天。 */
export default function CheckinCalendar({ year, month, dates, loading, onMonthChange }: Props) {
  const todayKey = toDateKey(new Date())
  const cells = useMemo(
    () => buildMonthGrid(year, month, new Set(dates), todayKey),
    [year, month, dates, todayKey],
  )
  const doneCount = dates.length

  const go = (dir: number) => {
    const next = shiftMonth(year, month, dir)
    onMonthChange(next.year, next.month)
  }

  return (
    <View className='cal'>
      <View className='cal__head'>
        <Text className='cal__nav press' onClick={() => go(-1)}>‹</Text>
        <Text className='cal__title'>{year} 年 {month} 月 · 打卡 {doneCount} 天</Text>
        <Text className='cal__nav press' onClick={() => go(1)}>›</Text>
      </View>

      <View className='cal__week'>
        {WEEK_LABELS.map((w) => (
          <Text key={w} className='cal__week-cell'>{w}</Text>
        ))}
      </View>

      <View className={`cal__grid ${loading ? 'is-loading' : ''}`}>
        {cells.map((c, i) => (
          <View key={c.key || `blank-${i}`} className='cal__cell'>
            {c.state !== 'blank' && (
              <View className={`cal__day cal__day--${c.state}`}>
                <Text className='cal__day-num'>{c.day}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <View className='cal__legend'>
        <View className='cal__legend-item'><View className='cal__dot cal__dot--done' /><Text className='cal__legend-text'>已打卡</Text></View>
        <View className='cal__legend-item'><View className='cal__dot cal__dot--miss' /><Text className='cal__legend-text'>缺卡</Text></View>
        <View className='cal__legend-item'><View className='cal__dot cal__dot--today' /><Text className='cal__legend-text'>今天</Text></View>
      </View>
    </View>
  )
}
