import { useCallback, useEffect, useRef, useState } from 'react'
import { postsApi } from '../services/api'

export type SaveStatus = 'idle' | 'saving' | 'saved'

interface Snapshot {
  title: string
  html: string
  text: string
  topics: string[]
}

interface Opts {
  editingId: number | null
  getSnapshot: () => Snapshot
}

const DEBOUNCE_MS = 1800

export function useDraftAutosave({ editingId, getSnapshot }: Opts) {
  // 编辑已有帖子时 draftId 即该帖 id；新建态从 null 起
  const [draftId, setDraftId] = useState<number | null>(editingId)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const draftIdRef = useRef<number | null>(editingId)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const creatingRef = useRef(false) // 首次 create 进行中
  const dirtyRef = useRef(false) // create 期间又有变化

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // 真正执行一次保存（create 或 update）
  const persist = useCallback(async () => {
    const snap = getSnapshot()
    // 空草稿防护：新建态 title 空 AND text 空则不 create
    if (draftIdRef.current === null && !snap.title.trim() && !snap.text.trim()) return
    const body = {
      title: snap.title,
      content: snap.html,
      topics: snap.topics,
    }
    setStatus('saving')
    try {
      if (draftIdRef.current === null) {
        if (creatingRef.current) {
          dirtyRef.current = true
          return
        }
        creatingRef.current = true
        const post = await postsApi.create({ ...body, status: 'DRAFT' })
        draftIdRef.current = post.id
        setDraftId(post.id)
        creatingRef.current = false
        // create 期间有新变化：补一次 update
        if (dirtyRef.current) {
          dirtyRef.current = false
          const s2 = getSnapshot()
          await postsApi.update(post.id, { title: s2.title, content: s2.html, topics: s2.topics })
        }
      } else {
        await postsApi.update(draftIdRef.current, body)
      }
      setStatus('saved')
    } catch {
      setStatus('idle')
    }
  }, [getSnapshot])

  // 外部调用：内容变化时触发 debounce
  const schedule = useCallback(() => {
    cancel()
    timerRef.current = setTimeout(() => {
      void persist()
    }, DEBOUNCE_MS)
  }, [cancel, persist])

  // flush：取消 pending，立即保存并等待完成（发布/离开兜底）
  const flush = useCallback(async () => {
    cancel()
    await persist()
  }, [cancel, persist])

  // 卸载清理
  useEffect(() => cancel, [cancel])

  return { draftId, status, schedule, flush, cancel }
}
