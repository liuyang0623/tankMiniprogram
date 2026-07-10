import { useState, useCallback, useRef } from 'react'

export interface ToggleState {
  active: boolean
  count: number
}

/** 计算 toggle 后的下一状态：激活翻转、计数增减（不为负） */
export function nextToggleState(s: ToggleState): ToggleState {
  const count = s.active ? Math.max(0, s.count - 1) : s.count + 1
  return { active: !s.active, count }
}

/**
 * 乐观 toggle：点击立即翻转本地态，调 action 成功以返回值为准、失败回滚。
 * action 返回服务端最终 active 值。onError 供上层提示。
 */
export function useOptimisticToggle(
  initial: ToggleState,
  action: () => Promise<boolean>,
  onError?: (msg: string) => void,
) {
  const [state, setState] = useState<ToggleState>(initial)
  const runningRef = useRef(false)

  const run = useCallback(async () => {
    if (runningRef.current) return
    runningRef.current = true
    const prev = state
    const optimistic = nextToggleState(prev)
    setState(optimistic)
    try {
      const serverActive = await action()
      // 以服务端返回状态为准：若与乐观值不同，按服务端修正计数
      setState((cur) =>
        cur.active === serverActive
          ? cur
          : { active: serverActive, count: serverActive ? prev.count + 1 : Math.max(0, prev.count - 1) },
      )
    } catch {
      setState(prev)
      onError?.('操作失败，请重试')
    } finally {
      runningRef.current = false
    }
  }, [state, action, onError])

  return { state, run, setState }
}
