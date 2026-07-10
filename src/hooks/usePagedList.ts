import { useState, useCallback, useRef } from 'react'
import type { Paginated } from '../types/api'

/** 是否还有下一页 */
export function computeHasMore(page: number, totalPages: number): boolean {
  return page < totalPages
}

/** 合并分页数据：append 追加、replace 替换 */
export function mergePage<T>(prev: T[], next: T[], mode: 'append' | 'replace'): T[] {
  return mode === 'replace' ? next : [...prev, ...next]
}

/**
 * 通用分页列表 hook。传入 fetchPage(page) => Paginated<T>，
 * 提供加载/加载更多/下拉刷新/重载与加载态，供信息流、评论、后续列表复用。
 */
export function usePagedList<T>(fetchPage: (page: number) => Promise<Paginated<T>>) {
  const [list, setList] = useState<T[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const loadingRef = useRef(false)

  const load = useCallback(
    async (targetPage: number, mode: 'append' | 'replace', asRefresh = false) => {
      if (loadingRef.current) return
      loadingRef.current = true
      if (asRefresh) setRefreshing(true)
      else setLoading(true)
      setError(false)
      try {
        const res = await fetchPage(targetPage)
        setList((prev) => mergePage(prev, res.data, mode))
        setPage(res.meta.page)
        setHasMore(computeHasMore(res.meta.page, res.meta.totalPages))
      } catch {
        setError(true)
      } finally {
        setLoading(false)
        setRefreshing(false)
        loadingRef.current = false
      }
    },
    [fetchPage],
  )

  // reload：首屏/重试加载，用 loading（不触发下拉刷新态）
  const reload = useCallback(() => load(1, 'replace', false), [load])
  // refresh：下拉刷新，用 refreshing
  const refresh = useCallback(() => load(1, 'replace', true), [load])
  const loadMore = useCallback(() => {
    if (hasMore && !loadingRef.current) load(page + 1, 'append', false)
  }, [hasMore, page, load])

  return { list, page, hasMore, loading, refreshing, error, loadMore, refresh, reload, setList }
}
