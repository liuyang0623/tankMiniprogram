import { describe, it, expect } from 'vitest'
import { unwrapFavorites } from '../favorites'
import type { PaginatedFavorites } from '../../types/api'

describe('unwrapFavorites', () => {
  it('从 {post, favoritedAt}[] 解包出 post 数组', () => {
    const res = {
      data: [
        { post: { id: 1, title: 'a' }, favoritedAt: 't1' },
        { post: { id: 2, title: 'b' }, favoritedAt: 't2' },
      ],
      meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
    } as unknown as PaginatedFavorites
    const out = unwrapFavorites(res)
    expect(out.data.map((p) => p.id)).toEqual([1, 2])
    expect(out.meta).toEqual(res.meta)
  })

  it('空收藏返回空数组', () => {
    const res = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } } as unknown as PaginatedFavorites
    expect(unwrapFavorites(res).data).toEqual([])
  })
})
