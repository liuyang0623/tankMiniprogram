import { describe, it, expect } from 'vitest'
import { computeHasMore, mergePage } from '../usePagedList'

describe('usePagedList 纯逻辑', () => {
  it('computeHasMore：page < totalPages 为 true', () => {
    expect(computeHasMore(1, 3)).toBe(true)
    expect(computeHasMore(2, 3)).toBe(true)
    expect(computeHasMore(3, 3)).toBe(false)
    expect(computeHasMore(1, 1)).toBe(false)
  })

  it('mergePage：append 追加，replace 替换', () => {
    expect(mergePage([{ id: 1 }], [{ id: 2 }], 'append')).toEqual([{ id: 1 }, { id: 2 }])
    expect(mergePage([{ id: 1 }], [{ id: 2 }], 'replace')).toEqual([{ id: 2 }])
    expect(mergePage([], [{ id: 1 }], 'append')).toEqual([{ id: 1 }])
  })
})
