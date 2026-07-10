---
comet_change: article-feed-and-detail
role: technical-design
canonical_spec: openspec
---

# article-feed-and-detail 技术设计

> 深化 `openspec/changes/article-feed-and-detail/design.md`。需求与验收场景以 `specs/*/spec.md` 为准，本文档不重复定义需求。

## 1. 概览

在地基层（`miniprogram-foundation`）之上实现「刷信息流 → 读详情 → 点赞/收藏/评论」核心路径。复用地基的 `services/api`、`components`、`store`、设计 token 与 `useAuthGuard`。

分层：
```
pages/index(信息流) ┐
pages/detail(详情)  ┼─ components(PostCard/InteractionBar/CommentList/CommentItem/CommentInput)
                    │      └─ hooks(usePagedList) ─ services/api(posts/interactions) ─ go-service
```

## 2. 核心抽象

### 2.1 usePagedList hook（`src/hooks/usePagedList.ts`）
统一分页逻辑，首页/评论/后续列表复用。

```ts
interface Paged<T> { data: T[]; meta: { totalPages: number; page: number } }
function usePagedList<T>(fetchPage: (page: number) => Promise<Paged<T>>): {
  list: T[]; page: number; hasMore: boolean
  loading: boolean; refreshing: boolean; error: boolean
  loadMore: () => void; refresh: () => Promise<void>; reload: () => void
  setList: (updater: (prev: T[]) => T[]) => void  // 供乐观更新/删除本地改列表
}
```
- 首屏 `reload`；触底 `loadMore`（loading 或 !hasMore 时忽略）；下拉 `refresh` 重置第一页
- `hasMore = page < meta.totalPages`
- 纯逻辑，测试注入 mock fetchPage

### 2.2 乐观更新模式（`src/hooks/useOptimisticToggle.ts` 或内联）
点赞/收藏/评论点赞共用：先改本地态与计数 → 调接口 → 成功以返回值为准 / 失败回滚 + `showToast`。未登录先 `useAuthGuard`。

## 3. 信息流首页

- `usePagedList(page => postsApi.findAll(page))`
- ScrollView：`onScrollToLower` → loadMore；`refresher-enabled` → refresh
- 状态映射：首屏 loading → SkeletonList；error → 重试；空 → 空态；success → PostCard 列表
- `PostCard` 点击 → `Taro.navigateTo({url:'/pages/detail/index?id='+id})`

## 4. 文章详情页（`pages/detail`）

- `useRouter().params.id` 取 id，加载 `postsApi.findOne(id)`
- 文章头：标题、Avatar+作者 name、Tag 话题、浏览/点赞/评论计数
- 正文：`<rich-text nodes={content}>`，基础 WXSS 兜底（img 宽度 100%、段落间距）
- **图片预览**：用正则/解析从 `content` 提取 `<img src>` 列表；因 rich-text 不支持子节点事件，在正文区叠加或解析后单独渲染可点击图片，点击 `Taro.previewImage({current, urls})`
- 互动态：`isLiked`/`isFavorited` 作为 InteractionBar 初始值

## 5. 互动组件

### 5.1 InteractionBar
点赞、收藏按钮 + 计数。乐观更新：
```
onLike: guard(async () => {
  const prev = {liked, likeCount}
  setLiked(!liked); setLikeCount(c => liked ? c-1 : c+1)  // 乐观
  try { const {liked: srv} = await interactionsApi.likePost(id); setLiked(srv) }
  catch { setLiked(prev.liked); setLikeCount(prev.likeCount); showToast('操作失败','error') }
})
```
收藏同理（`{favorited}`）。

### 5.2 CommentList / CommentItem / CommentInput
- `CommentList`：`usePagedList(page => interactionsApi.getComments(postId, page))`
- `CommentItem`：**递归组件**，渲染自身 + `replies.map(CommentItem)`；`depth` prop 控制缩进，超过限深（如 3）不再加缩进、回复用 `@昵称` 前缀
  - 评论点赞：本地乐观态 + 预留 `interactionsApi.likeComment(id)`（后端暂无，注释标注）
  - 删除：本人评论显示删除，调 `deleteComment` 后 `setList` 本地移除
  - 回复：点「回复」→ CommentInput 带 `parentId`
- `CommentInput`：输入 + 提交，未登录 `useAuthGuard` 引导登录

## 6. 类型增量（`src/types/api.ts`）

- `Post` 补 `isLiked?: boolean`、`isFavorited?: boolean`
- `PaginationMeta` 补 `totalPages: number`
- `Comment` 补 `likeCount?: number`、`isLiked?: boolean`（前端乐观本地字段）、`authorId?`（判断删除权限）
- 新增 `PaginatedComments = Paginated<Comment>`
- `interactionsApi` 补 `likeComment(id)` 预留方法（注释后端待补）

归档时并入 data-access 主 spec 的类型说明。

## 7. 测试策略

- 单元（vitest）：
  - `usePagedList`：首屏加载、loadMore 追加、refresh 重置、到底 hasMore=false、error 分支
  - 乐观更新：成功以返回值为准、失败回滚
- 类型：`tsc --noEmit`
- 编译：`bun run build:weapp`
- 手动冒烟：开发者工具验证信息流滚动/刷新、进详情、rich-text、图片预览、点赞收藏、评论回复/评论点赞（服务端未起时验证兜底 UI 与交互逻辑）

## 8. 风险与缓解

| 风险 | 缓解 |
|------|------|
| rich-text 不支持子节点事件（图片预览） | 解析 content 的 img 单独处理，previewImage |
| rich-text 标签/样式支持有限 | 基础 WXSS 兜底，复杂回显后置到 publish change |
| 评论点赞后端无接口 | 前端本地乐观态 + 预留 likeComment，就绪后接入不改 UI |
| 评论 replies 后端只返一层 | CommentItem 递归，后端返几层显几层，加深自动生效 |
| 乐观更新与后端不一致 | 以 toggle 返回值覆盖本地态，失败回滚 |
| 服务端未启动 | 复用地基已验证请求层错误处理 + 兜底 UI |

## 9. 非目标（YAGNI）

不引 SWR/react-query；不做评论排序/热度、@提及自动补全；不做多端输出。
