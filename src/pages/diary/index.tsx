import { useState, useCallback } from 'react'
import { View, Text, Swiper, SwiperItem } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { NotebookDrawer, DiaryCard, PageLayout } from '../../components'
import { notebookApi, diaryApi } from '../../services/api'
import { useAuthStore } from '../../store/auth'
import { useUiStore } from '../../store/ui'
import type { Notebook, DiaryListItem } from '../../types/diary'
import './index.scss'

export default function DiaryIndex() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [activeNb, setActiveNb] = useState<number>()
  const [diaries, setDiaries] = useState<DiaryListItem[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const showToast = useUiStore((s) => s.showToast)

  const loadDiaries = useCallback(async (nbId: number) => {
    try {
      const r = await diaryApi.list({ notebookId: nbId })
      setDiaries(r.data)
    } catch {
      setDiaries([])
    }
  }, [])

  const loadNotebooks = useCallback(async () => {
    if (!useAuthStore.getState().isLogin) return
    try {
      const nbs = await notebookApi.list()
      setNotebooks(nbs)
      const first = nbs[0]?.id
      setActiveNb((prev) => {
        const keep = prev && nbs.some((n) => n.id === prev) ? prev : first
        if (keep) loadDiaries(keep)
        return keep
      })
    } catch {
      // 未登录或网络失败，忽略
    }
  }, [loadDiaries])

  useDidShow(() => {
    loadNotebooks()
  })

  const activeNotebook = notebooks.find((n) => n.id === activeNb)

  const onSelectNb = (id: number) => {
    setActiveNb(id)
    setDrawerOpen(false)
    loadDiaries(id)
  }

  const onCreateNb = async () => {
    const res = await Taro.showModal({ title: '新建日记本', editable: true, placeholderText: '日记本名称' } as any)
    const content = (res as any).content as string | undefined
    if (res.confirm && content) {
      const nb = await notebookApi.create({ name: content, color: '#f0a868' })
      setDrawerOpen(false)
      await loadNotebooks()
      onSelectNb(nb.id)
    }
  }

  const onManage = async () => {
    setDrawerOpen(false)
    if (!activeNotebook) return
    const res = await Taro.showActionSheet({ itemList: ['改名', '删除'] })
    if (res.tapIndex === 0) {
      const r = await Taro.showModal({ title: '改名', editable: true, content: activeNotebook.name } as any)
      const content = (r as any).content as string | undefined
      if (r.confirm && content) {
        await notebookApi.update(activeNotebook.id, { name: content })
        loadNotebooks()
      }
    } else if (res.tapIndex === 1) {
      const r = await Taro.showModal({ title: '删除日记本', content: '删除后本内日记将移出该本，确认？' })
      if (r.confirm) {
        await notebookApi.remove(activeNotebook.id)
        showToast('已删除')
        loadNotebooks()
      }
    }
  }

  const onWrite = () => {
    Taro.navigateTo({ url: `/pages/diary/edit?notebookId=${activeNb ?? ''}` })
  }

  return (
    <PageLayout>
      <View className='diary-header' onClick={() => setDrawerOpen(true)}>
        <Text className='diary-header__name'>{activeNotebook?.name ?? '我的日记本'}</Text>
        <Text className='diary-header__arrow'>▼</Text>
      </View>

      <NotebookDrawer
        open={drawerOpen}
        notebooks={notebooks}
        activeId={activeNb}
        onSelect={onSelectNb}
        onCreate={onCreateNb}
        onManage={onManage}
        onClose={() => setDrawerOpen(false)}
      />

      {diaries.length === 0 ? (
        <View className='diary-empty'>
          <Text className='diary-empty__text'>这个本子还没有日记，写第一篇吧</Text>
        </View>
      ) : (
        <Swiper className='diary-swiper' circular={false} previousMargin='24px' nextMargin='24px'>
          {diaries.map((d) => (
            <SwiperItem key={d.id}>
              <DiaryCard
                diary={d}
                notebookColor={activeNotebook?.color ?? '#f0a868'}
                onTap={() => Taro.navigateTo({ url: `/pages/diary/detail?id=${d.id}` })}
              />
            </SwiperItem>
          ))}
        </Swiper>
      )}

      <View className='diary-fab' onClick={onWrite}>
        <Text className='diary-fab__plus'>＋</Text>
      </View>
    </PageLayout>
  )
}
