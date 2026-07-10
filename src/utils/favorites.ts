import type { PaginatedFavorites, Paginated, Post } from '../types/api'

/** 从收藏分页 {post, favoritedAt}[] 解包出 post 数组，喂给 usePagedList */
export function unwrapFavorites(res: PaginatedFavorites): Paginated<Post> {
  const items = res.data ?? []
  return { data: items.map((item) => item.post), meta: res.meta }
}
