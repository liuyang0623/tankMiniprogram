import { useState, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { PageLayout } from '../../components'
import { sportApi } from '../../services/api'
import { useAuthStore } from '../../store/auth'
import { useUiStore } from '../../store/ui'
import { login } from '../../services/auth'
import type { SportGoal } from '../../types/inspiration'
import './sport.scss'

export default function SportPage() {
  const [goals, setGoals] = useState<SportGoal[]>([])
  const [celebrateId, setCelebrateId] = useState<number | null>(null)
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
                <View className='sport-card__top'>
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
                    onClick={() => onCheckin(g)}
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
                <Text className='sport-card__target'>
                  {g.targetDays > 0 ? `目标 ${g.targetDays} 天 · 已完成 ${progress(g)}%` : '自由坚持'}
                </Text>
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
