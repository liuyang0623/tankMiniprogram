---
change: article-feed-and-detail
design-doc: docs/superpowers/specs/2026-07-10-article-feed-and-detail-design.md
base-ref: 8554a141ea79e4c72c549fc1b450d66e0b43797b
---

# 信息流+详情+互动 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在地基层之上实现「刷信息流 → 读详情 → 点赞/收藏/评论」核心路径，含富文本图片预览、评论点赞（预留接口）、评论递归嵌套。

**Architecture:** `usePagedList` hook 统一分页；乐观更新处理点赞/收藏/评论点赞；独立详情页 `rich-text` 渲染；评论 `CommentItem` 递归。复用地基 components/store/api/useAuthGuard。

**Tech Stack:** Taro 4、React 18、TypeScript、bun、Zustand、vitest。

## Global Constraints

- 复用地基层：`src/components`（Card/Avatar/Tag/Button/Skeleton/Toast）、`src/store`、`src/services/api`、`src/hooks/useAuthGuard`、设计 token
- 所有网络请求经 `src/services/api/*`（底层 request 已处理 baseURL/JWT/401/网络错误）
- 后端契约：`GET /posts` 分页 `{data,meta:{totalPages}}`；`GET /posts/:id` 带 `isLiked/isFavorited`；点赞 `{liked}`、收藏 `{favorited}`；评论分页 `{data,meta}`，`Comment.replies` 嵌套
- 评论点赞后端暂无接口 → 前端本地乐观 + 预留 `interactions.likeComment`
- 动效仅 transform/opacity；语言简体中文；单位 rpx

---

### Task 1: 类型增量与 API 预留

**Files:**
- Modify: `src/types/api.ts`
- Modify: `src/services/api/interactions.ts`

- [ ] **Step 1: 补充类型字段**

`src/types/api.ts`：
- `Post` 加 `isLiked?: boolean`、`isFavorited?: boolean`
- `PaginationMeta` 加 `totalPages: number`
- `Comment` 加 `authorId?: number`、`author?: PostAuthor`、`likeCount?: number`、`isLiked?: boolean`
- 末尾加 `export type PaginatedComments = Paginated<Comment>`

- [ ] **Step 2: interactions 补预留方法**

`src/services/api/interactions.ts` 的 `interactionsApi` 加：
```ts
// 后端暂无评论点赞接口，预留；就绪后放开实现
likeComment: (_id: number) => Promise.resolve<{ liked: boolean }>({ liked: true }),
```
并确认 `getComments(postId, page)` 返回 `Paginated<Comment>`（若签名是 `Comment[]` 改为分页）。

- [ ] **Step 3: 类型校验 + Commit**

Run: `bunx tsc --noEmit` → 0 错误
```bash
git add src/types src/services/api
git commit -m "feat(feed): 类型增量与评论点赞预留接口"
```

---

### Task 2: usePagedList hook（TDD）

**Files:**
- Create: `src/hooks/usePagedList.ts`
- Test: `src/hooks/__tests__/usePagedList.test.ts`

**Interfaces:**
- Produces: `usePagedList<T>(fetchPage): { list,page,hasMore,loading,refreshing,error,loadMore,refresh,reload,setList }`

- [ ] **Step 1: 写失败测试**

`src/hooks/__tests__/usePagedList.test.ts`（用 `@tarojs/test-utils-react` 的 renderHook 或 React 测试工具；若不可用，将分页逻辑抽为纯函数 `pagedReducer` 测试）。为降低小程序渲染依赖，本计划将核心逻辑抽为纯函数测试：
```ts
import { describe, it, expect } from 'vitest'
import { computeHasMore, mergePage } from '../usePagedList'

describe('usePagedList 纯逻辑', () => {
  it('computeHasMore：page < totalPages 为 true', () => {
    expect(computeHasMore(1, 3)).toBe(true)
    expect(computeHasMore(3, 3)).toBe(false)
  })
  it('mergePage：refresh 替换，loadMore 追加', () => {
    expect(mergePage([{id:1}], [{id:2}], 'append')).toEqual([{id:1},{id:2}])
    expect(mergePage([{id:1}], [{id:2}], 'replace')).toEqual([{id:2}])
  })
})
```

- [ ] **Step 2: 运行确认失败** — `bunx vitest run src/hooks/__tests__/usePagedList.test.ts` → FAIL

- [ ] **Step 3: 实现 usePagedList**

导出纯函数 `computeHasMore(page,totalPages)`、`mergePage(prev,next,mode)`，以及 `usePagedList` hook：
```ts
import { useState, useCallback, useRef } from 'react'
import type { Paginated } from '../types/api'

export function computeHasMore(page: number, totalPages: number) { return page < totalPages }
export function mergePage<T>(prev: T[], next: T[], mode: 'append' | 'replace') {
  return mode === 'replace' ? next : [...prev, ...next]
}

export function usePagedList<T>(fetchPage: (page: number) => Promise<Paginated<T>>) {
  const [list, setList] = useState<T[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const loadingRef = useRef(false)

  const load = useCallback(async (targetPage: number, mode: 'append' | 'replace') => {
    if (loadingRef.current) return
    loadingRef.current = true
    mode === 'replace' ? setRefreshing(true) : setLoading(true)
    setError(false)
    try {
      const res = await fetchPage(targetPage)
      setList(prev => mergePage(prev, res.data, mode))
      setPage(res.meta.page)
      setHasMore(computeHasMore(res.meta.page, res.meta.totalPages))
    } catch {
      setError(true)
    } finally {
      setLoading(false); setRefreshing(false); loadingRef.current = false
    }
  }, [fetchPage])

  const reload = useCallback(() => load(1, 'replace'), [load])
  const refresh = useCallback(() => load(1, 'replace'), [load])
  const loadMore = useCallback(() => { if (hasMore && !loadingRef.current) load(page + 1, 'append') }, [hasMore, page, load])

  return { list, page, hasMore, loading, refreshing, error, loadMore, refresh, reload, setList }
}
```

- [ ] **Step 4: 运行确认通过** — PASS

- [ ] **Step 5: Commit**
```bash
git add src/hooks
git commit -m "feat(feed): usePagedList 分页 hook + 纯逻辑单测"
```

---

### Task 3: 乐观更新 hook（TDD）

**Files:**
- Create: `src/hooks/useOptimisticToggle.ts`
- Test: `src/hooks/__tests__/useOptimisticToggle.test.ts`

**Interfaces:**
- Produces: 纯函数 `applyToggle(state, delta)` + hook；供点赞/收藏/评论点赞复用

- [ ] **Step 1: 写失败测试**
```ts
import { describe, it, expect } from 'vitest'
import { nextToggleState } from '../useOptimisticToggle'

describe('nextToggleState', () => {
  it('未激活→激活，计数+1', () => {
    expect(nextToggleState({ active: false, count: 2 })).toEqual({ active: true, count: 3 })
  })
  it('激活→未激活，计数-1', () => {
    expect(nextToggleState({ active: true, count: 3 })).toEqual({ active: false, count: 2 })
  })
})
```

- [ ] **Step 2: 确认失败** — FAIL

- [ ] **Step 3: 实现**
```ts
export interface ToggleState { active: boolean; count: number }
export function nextToggleState(s: ToggleState): ToggleState {
  return { active: !s.active, count: s.active ? s.count - 1 : s.count + 1 }
}
```
hook 版：`useOptimisticToggle(initial, action)` 返回 `{state, run}`，run 内乐观改 → 调 action → 失败回滚（详细见 Design Doc 5.1）。

- [ ] **Step 4: 确认通过** — PASS

- [ ] **Step 5: Commit**
```bash
git add src/hooks
git commit -m "feat(interactions): 乐观更新 toggle hook + 单测"
```

---

### Task 4: 信息流首页

**Files:**
- Create: `src/components/PostCard/index.tsx`
- Modify: `src/pages/index/index.tsx`

- [ ] **Step 1: PostCard 组件**

复用地基 Card/Avatar/Tag。展示 title、content 摘要、author.name+avatar、topics、likeCount/commentCount。点击 `Taro.navigateTo({url:'/pages/detail/index?id='+post.id})`。

- [ ] **Step 2: 首页接 usePagedList**

`pages/index/index.tsx` 用 `usePagedList(p => postsApi.findAll(p))`；ScrollView `refresher-enabled` 绑 refresh、`onScrollToLower` 绑 loadMore；映射 loading→SkeletonList / error→重试 / 空→空态 / success→PostCard 列表 + 到底提示。

- [ ] **Step 3: 编译验证 + Commit**

Run: `bun run build:weapp` → success
```bash
git add src/components/PostCard src/pages/index
git commit -m "feat(feed): 信息流首页分页/刷新/加载更多 + PostCard"
```

---

### Task 5: 文章详情页

**Files:**
- Create: `src/pages/detail/index.tsx`、`index.config.ts`、`index.scss`
- Modify: `src/app.config.ts`
- Create: `src/utils/richtext.ts`（提取 img）

- [ ] **Step 1: 注册路由**

`src/app.config.ts` 的 pages 加 `'pages/detail/index'`。

- [ ] **Step 2: 详情加载与渲染**

`useRouter().params.id` → `postsApi.findOne(id)`；骨架/错误态；文章头（标题/Avatar+作者/Tag 话题/浏览计数）；`<RichText nodes={content}>` 渲染正文。

- [ ] **Step 3: 图片预览工具**

`src/utils/richtext.ts` 导出 `extractImageUrls(html: string): string[]`（正则 `/<img[^>]+src=["']([^"']+)["']/g`）。详情页解析后，图片区可点击 → `Taro.previewImage({ current, urls })`。

- [ ] **Step 4: 编译验证 + Commit**
```bash
git add src/pages/detail src/app.config.ts src/utils
git commit -m "feat(detail): 详情页 rich-text 渲染 + 图片预览"
```

---

### Task 6: 点赞收藏互动栏

**Files:**
- Create: `src/components/InteractionBar/index.tsx`
- Modify: `src/pages/detail/index.tsx`

- [ ] **Step 1: InteractionBar**

点赞、收藏按钮 + 计数，初始值来自 `isLiked/isFavorited/likeCount`。乐观更新（复用 useOptimisticToggle）：点击即改 → `interactionsApi.likePost/favoritePost` → 成功以 `{liked}`/`{favorited}` 为准 / 失败回滚 + showToast。未登录经 `useAuthGuard`。

- [ ] **Step 2: 挂到详情页 + 编译 + Commit**
```bash
git add src/components/InteractionBar src/pages/detail
git commit -m "feat(interactions): 详情页点赞收藏乐观更新"
```

---

### Task 7: 评论功能

**Files:**
- Create: `src/components/CommentList/index.tsx`、`src/components/CommentItem/index.tsx`、`src/components/CommentInput/index.tsx`
- Modify: `src/pages/detail/index.tsx`

- [ ] **Step 1: CommentList**

`usePagedList(p => interactionsApi.getComments(postId, p))`，加载更多。空态提示。

- [ ] **Step 2: CommentItem（递归 + 评论点赞 + 删除）**

递归组件：渲染自身（Avatar+作者+内容+时间）+ `replies.map(CommentItem depth+1)`；`depth` 超限深（3）不再加缩进、`@昵称` 前缀。评论点赞按钮（本地乐观 + 预留 likeComment）。本人评论（`authorId===当前user.id`）显示删除 → `deleteComment` + 本地移除。

- [ ] **Step 3: CommentInput（发表/回复）**

输入 + 提交，`createComment({postId, content, parentId?})`，未登录 `useAuthGuard`。提交成功插入列表。

- [ ] **Step 4: 挂到详情页 + 编译 + Commit**
```bash
git add src/components/CommentList src/components/CommentItem src/components/CommentInput src/pages/detail
git commit -m "feat(interactions): 评论列表/递归回复/评论点赞/删除"
```

---

### Task 8: 全量验证

- [ ] **Step 1: 全量校验**

Run: `bunx tsc --noEmit && bunx vitest run && bun run build:weapp` → 全绿

- [ ] **Step 2: 提交剩余变更**
```bash
git add -A
git commit -m "chore(feed): 全量验证通过" || true
```

---

## Self-Review

- **Spec 覆盖**：article-feed→Task4；article-detail（含图片预览）→Task5；post-interactions（点赞收藏/评论/递归/评论点赞/删除）→Task6-7。
- **占位符**：无 TBD；代码步骤含真实代码。
- **类型一致**：`usePagedList`/`nextToggleState`/`postsApi.*`/`interactionsApi.*`/`PaginatedComments` 跨任务一致。
- **已知项**：评论点赞后端无接口（前端预留，本地态）；rich-text 复杂回显与真实数据需服务端联调。
