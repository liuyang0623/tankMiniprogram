import { useState, useCallback, useRef } from 'react'
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
  const activeNbRef = useRef<number>()
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
      // 保持当前选中；已失效或首次进入则回落到第一个本
      const prev = activeNbRef.current
      const keep = prev && nbs.some((n) => n.id === prev) ? prev : nbs[0]?.id
      if (keep) {
        setActiveNb(keep)
        activeNbRef.current = keep
        loadDiaries(keep)
      }
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
    activeNbRef.current = id
    setDrawerOpen(false)
    loadDiaries(id)
  }

  const onCreateNb = async () => {
    const res = await Taro.showModal({ title: '新建日记本', editable: true, placeholderText: '日记本名称' } as any)
    const content = (res as any).content as string | undefined
    if (res.confirm && content) {
      try {
        const nb = await notebookApi.create({ name: content, color: '#f0a868' })
        setDrawerOpen(false)
        await loadNotebooks()
        onSelectNb(nb.id)
      } catch {
        showToast('新建失败，请重试', 'error')
      }
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
        try {
          await notebookApi.update(activeNotebook.id, { name: content })
          loadNotebooks()
        } catch {
          showToast('改名失败，请重试', 'error')
        }
      }
    } else if (res.tapIndex === 1) {
      const r = await Taro.showModal({ title: '删除日记本', content: '删除后本内日记将移出该本，确认？' })
      if (r.confirm) {
        try {
          await notebookApi.remove(activeNotebook.id)
          showToast('已删除')
          loadNotebooks()
        } catch {
          showToast('删除失败，请重试', 'error')
        }
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
            <SwiperItem key={d.id} className='diary-swiper-item'>
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
