import { useCallback, useEffect, useRef, useState } from 'react'
import { postsApi } from '../services/api'
import { canPersistDraft } from '../utils/publish'

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
  // 串行化：记录在飞的一次保存，新的保存先 await 它，避免并发 create/update
  const inFlightRef = useRef<Promise<void> | null>(null)

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // 单次保存的真正执行体（不含串行化）
  const runPersist = useCallback(async () => {
    const snap = getSnapshot()
    // 空正文防护：后端 content 必填，正文为空一律不保存（含"只写标题"场景）。
    // 覆盖 create 与 update：都不该提交空 content。
    if (!canPersistDraft(snap.text)) return
    const body = {
      title: snap.title,
      content: snap.html,
      topics: snap.topics,
    }
    setStatus('saving')
    try {
      if (draftIdRef.current === null) {
        const post = await postsApi.create({ ...body, status: 'DRAFT' })
        draftIdRef.current = post.id
        setDraftId(post.id)
      } else {
        await postsApi.update(draftIdRef.current, body)
      }
      setStatus('saved')
    } catch {
      setStatus('idle')
    }
  }, [getSnapshot])

  // persist：串行化入口。若已有在飞保存，先等它完成再执行本次，
  // 保证同一时刻至多一个 create/update，杜绝重复建帖与更新丢失。
  const persist = useCallback(async (): Promise<void> => {
    const prev = inFlightRef.current
    const run = (async () => {
      if (prev) await prev
      await runPersist()
    })()
    inFlightRef.current = run
    try {
      await run
    } finally {
      // 仅当自己仍是最新在飞任务时清空，避免抹掉后来者
      if (inFlightRef.current === run) inFlightRef.current = null
    }
  }, [runPersist])

  // 外部调用：内容变化时触发 debounce
  const schedule = useCallback(() => {
    cancel()
    timerRef.current = setTimeout(() => {
      void persist()
    }, DEBOUNCE_MS)
  }, [cancel, persist])

  // flush：取消 pending，立即保存并等待所有在飞保存完成，返回最终 draftId。
  // 发布前调用以串行化：确保草稿 id 已落定，避免 submit 读到过期 null。
  const flush = useCallback(async (): Promise<number | null> => {
    cancel()
    await persist()
    // persist 内部已串行等待在飞任务，此处 draftIdRef 为最终值
    return draftIdRef.current
  }, [cancel, persist])

  // 卸载清理
  useEffect(() => cancel, [cancel])

  return { draftId, draftIdRef, status, schedule, flush, cancel }
}
