import type { FindPostsParams } from '../../services/api/posts'

/** 分类 tab 项 */
export interface CategoryTab {
  key: string // 唯一键
  label: string // 显示名
}

/**
 * tab key → 文章列表查询参数映射（纯函数，可单测）。
 * following/recommend/other 是虚拟分类，其余是真实 category。
 */
export function tabToQuery(key: string): Partial<FindPostsParams> {
  switch (key) {
    case 'following':
      return { following: true }
    case 'recommend':
      return { sort: 'likes' }
    case 'other':
      return { category: 'none' }
    default:
      return { category: key } // story/daily/tech/food/travel
  }
}
