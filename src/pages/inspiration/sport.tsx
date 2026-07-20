import { useState, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { PageLayout, CheckinCalendar } from '../../components'
import { toDateKey, toMonthKey } from '../../components/CheckinCalendar/calendar'
import { sportApi } from '../../services/api'
import { useAuthStore } from '../../store/auth'
import { useUiStore } from '../../store/ui'
import { login } from '../../services/auth'
import type { SportGoal } from '../../types/inspiration'
import './sport.scss'

interface CalState {
  year: number
  month: number
  dates: string[]
  loading: boolean
}

export default function SportPage() {
  const [goals, setGoals] = useState<SportGoal[]>([])
  const [celebrateId, setCelebrateId] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  // 每个目标的日历状态（当前查看的年月与打卡日期）
  const [cal, setCal] = useState<Record<number, CalState>>({})
  const isLogin = useAuthStore((s) => s.isLogin)
  const showToast = useUiStore((s) => s.showToast)

  const load = useCallback(async () => {
    if (!useAuthStore.getState().isLogin) return
    try {
      const r = await sportApi.list()
      setGoals(r)
    } catch {
      setGoals([])
    }
  }, [])

  useDidShow(() => {
    load()
  })

  // 拉取某目标某年月的打卡记录并写入缓存。
  const fetchRecords = useCallback(async (goalId: number, year: number, month: number) => {
    setCal((prev) => ({
      ...prev,
      [goalId]: { year, month, dates: prev[goalId]?.dates ?? [], loading: true },
    }))
    try {
      const r = await sportApi.monthRecords(goalId, toMonthKey(year, month))
      setCal((prev) => ({ ...prev, [goalId]: { year, month, dates: r.dates, loading: false } }))
    } catch {
      setCal((prev) => ({ ...prev, [goalId]: { year, month, dates: [], loading: false } }))
    }
  }, [])

  const toggleExpand = (goal: SportGoal) => {
    if (expandedId === goal.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(goal.id)
    // 首次展开或未加载时，拉当月记录。
    if (!cal[goal.id]) {
      const now = new Date()
      fetchRecords(goal.id, now.getFullYear(), now.getMonth() + 1)
    }
  }

  const onCreate = async () => {
    const res = await Taro.showModal({
      title: '新的运动目标',
      editable: true,
      placeholderText: '如：每天跑步、每天喝2L水',
    } as any)
    const content = (res as any).content as string | undefined
    if (res.confirm) {
      if (!content || !content.trim()) {
        showToast('目标名称不能为空', 'error')
        return
      }
      try {
        await sportApi.create({ name: content.trim(), targetDays: 30 })
        showToast('目标已创建，加油坚持')
        load()
      } catch {
        showToast('创建失败，请重试', 'error')
      }
    }
  }

  const onCheckin = async (goal: SportGoal) => {
    if (goal.checkedInToday) return
    try {
      const r = await sportApi.checkin(goal.id)
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goal.id
            ? { ...g, streak: r.streak, totalDays: r.totalDays, checkedInToday: true }
            : g,
        ),
      )
      // 若日历正看当月，把今天并入打卡日期让其即时高亮。
      const now = new Date()
      const todayKey = toDateKey(now)
      setCal((prev) => {
        const c = prev[goal.id]
        if (!c || c.year !== now.getFullYear() || c.month !== now.getMonth() + 1) return prev
        if (c.dates.includes(todayKey)) return prev
        return { ...prev, [goal.id]: { ...c, dates: [...c.dates, todayKey] } }
      })
      setCelebrateId(goal.id)
      Taro.vibrateShort?.({ type: 'medium' } as any).catch(() => {})
      setTimeout(() => setCelebrateId(null), 700)
    } catch {
      showToast('打卡失败，请重试', 'error')
    }
  }

  const progress = (g: SportGoal) => {
    if (!g.targetDays || g.targetDays <= 0) return Math.min(g.totalDays * 4, 100)
    return Math.min(Math.round((g.totalDays / g.targetDays) * 100), 100)
  }

  if (!isLogin) {
    return (
      <PageLayout>
        <View className='sport-guest'>
          <Text className='sport-guest__emoji'>🏃</Text>
          <Text className='sport-guest__title'>登录后开始运动计划</Text>
          <Text className='sport-guest__hint'>每天一点点，坚持看得见</Text>
          <View
            className='sport-guest__btn press'
            onClick={() => {
              login()
                .then(() => load())
                .catch((e: any) => showToast(e?.message || '登录失败，请重试', 'error'))
            }}
          >
            <Text className='sport-guest__btn-text'>微信一键登录</Text>
          </View>
        </View>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <View className='sport-page'>
        <View className='sport-head anim-in'>
          <Text className='sport-head__title'>运动计划</Text>
          <Text className='sport-head__sub'>坚持是最温柔的自律</Text>
        </View>

        <View className='sport-list'>
          {goals.length === 0 ? (
            <View className='sport-empty'>
              <Text className='sport-empty__emoji'>🌟</Text>
              <Text className='sport-empty__text'>还没有目标，创建一个开始坚持吧</Text>
            </View>
          ) : (
            goals.map((g, i) => (
              <View
                key={g.id}
                className='sport-card anim-stagger'
                style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}
              >
                <View className='sport-card__top press' onClick={() => toggleExpand(g)}>
                  <View className='sport-card__info'>
                    <Text className='sport-card__name'>{g.name}</Text>
                    <Text className='sport-card__stat'>
                      连续 {g.streak} 天 · 累计 {g.totalDays} 天
                    </Text>
                  </View>
                  <View
                    className={`sport-checkin press ${g.checkedInToday ? 'done' : ''} ${
                      celebrateId === g.id ? 'anim-celebrate' : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onCheckin(g)
                    }}
                  >
                    {celebrateId === g.id && <View className='sport-checkin__pulse anim-ring-pulse' />}
                    <Text className='sport-checkin__text'>
                      {g.checkedInToday ? '已打卡' : '打卡'}
                    </Text>
                  </View>
                </View>

                <View className='sport-bar'>
                  <View className='sport-bar__fill' style={{ width: `${progress(g)}%` }} />
                </View>
                <View className='sport-card__foot'>
                  <Text className='sport-card__target'>
                    {g.targetDays > 0 ? `目标 ${g.targetDays} 天 · 已完成 ${progress(g)}%` : '自由坚持'}
                  </Text>
                  <Text className='sport-card__toggle press' onClick={() => toggleExpand(g)}>
                    {expandedId === g.id ? '收起日历 ▲' : '查看日历 ▼'}
                  </Text>
                </View>

                {expandedId === g.id && (
                  <View className='sport-card__cal anim-in'>
                    <CheckinCalendar
                      year={cal[g.id]?.year ?? new Date().getFullYear()}
                      month={cal[g.id]?.month ?? new Date().getMonth() + 1}
                      dates={cal[g.id]?.dates ?? []}
                      loading={cal[g.id]?.loading}
                      onMonthChange={(y, m) => fetchRecords(g.id, y, m)}
                    />
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        <View className='sport-fab press' onClick={onCreate}>
          <Text className='sport-fab__text'>＋ 新目标</Text>
        </View>
      </View>
    </PageLayout>
  )
}
