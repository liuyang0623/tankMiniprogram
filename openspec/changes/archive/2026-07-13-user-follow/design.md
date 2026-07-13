## Context

后端 follow 能力已就绪（`POST /users/:id/follow`、`GET /users/:id/followers`、`GET /users/:id/following`、`GET /users/:id` 返回 `followerCount/followingCount/isFollowing`）。前端现有可复用件：`request/authRequest`、`PageLayout`（主题容器）、`Avatar`、`PostCard`、`usePagedList`、`usersApi`。本 change 纯前端，无后端改动。

现状要点：
- `PostCard` 作者区（`src/components/PostCard/index.tsx:36-41`）展示 `post.author.avatar/name`，`post.author.id` 可用；卡片已有 `stopPropagation` 模式（action 区 line 30）
- `User` 类型（`types/api.ts:13`）无计数字段；`PaginationMeta` 已定义
- `usePagedList(fetchPage)` 泛型分页 hook 可直接复用于列表页与他人主页帖子流

## Goals / Non-Goals

**Goals:**
- 新建他人主页 `user-profile`，展示用户信息 + 三计数 + 关注/私信按钮 + 已发布帖子流
- 新建 `follow-list` 页，粉丝/关注一页两用，支持分页 + 项内关注切换
- 全局 `followStore` 统一关注关系与计数，关注/取关乐观更新 + 失败回滚 + 跨页即时同步
- 4 处头像/昵称入口接入他人主页跳转
- 我的页展示关注/粉丝计数并链接列表页
- 私信按钮占位禁用 +「即将上线」提示

**Non-Goals:**
- 不实现私信本体（后续 change③④）
- 不改后端
- 不做关注动态/推荐关注/互相关注标记
- 不做列表项的批量操作、搜索、字母索引

## Decisions

### D1. 他人主页独立页面 `pages/user-profile`
- 路由 `pages/user-profile/index?id=<userId>`，从 `router.params.id` 取目标用户
- `useDidShow` 或 onLoad 拉 `usersApi.getUser(id)` 得资料 + 三计数 + isFollowing，写入 followStore
- 帖子流复用 `usePagedList(p => usersApi.getUserPosts(id, p))` + `PostCard`
- 用 `PageLayout` 包裹以继承主题
- 目标用户 == 当前登录用户时，隐藏关注/私信按钮（spec 场景）——比对 `authStore` 里的当前用户 id

### D2. 全局 followStore（zustand）
```ts
interface FollowState {
  // 目标用户 id -> 是否已关注（当前登录用户视角）
  followingMap: Record<number, boolean>
  // 目标用户 id -> 计数快照（粉丝/关注/获赞），用于跨页同步展示
  countsMap: Record<number, { followerCount: number; followingCount: number; likeCount?: number }>
  hydrateUser: (id, { isFollowing, followerCount, followingCount, likeCount }) => void
  toggle: (id) => Promise<void>  // 乐观更新 + 调 API + 失败回滚
  isFollowing: (id) => boolean
}
```
- `toggle`：先乐观翻转 `followingMap[id]` 并对该用户 `followerCount` ±1，再调 `usersApi.toggleFollow(id)`；后端返回 `{following}` 为准校正；失败回滚到操作前快照 + Toast
- 未登录拦截：`toggle` 前查 `authStore.isLogin`，未登录触发 `login()`，不发请求（spec 场景）
- 页面组件通过订阅 followStore 的 `followingMap[id]` / `countsMap[id]` 渲染，实现「一处关注多处同步」（D5）

### D3. follow-list 页一页两用
- 路由 `pages/follow-list/index?userId=<id>&type=followers|following`
- `type` 决定标题（「粉丝」/「关注」）与数据源（`getFollowers`/`getFollowing`）
- `usePagedList(p => type==='followers' ? usersApi.getFollowers(userId,p) : usersApi.getFollowing(userId,p))`
- 列表项组件 `FollowUserRow`：头像 + 昵称 + 简介 + 关注按钮（读 followStore，点击 toggle，stopPropagation）；点击行体进他人主页
- 列表加载时把每项 `isFollowing` hydrate 进 followStore，保证项内按钮与全局一致

### D4. API 与类型扩展（users.ts / types/api.ts）
```ts
// types/api.ts
interface User { ...; followerCount?: number; followingCount?: number; isFollowing?: boolean }
interface FollowUserItem { id: number; nickname: string; avatar: string; bio: string; isFollowing: boolean }
// users.ts
toggleFollow: (id) => authRequest<{following:boolean}>({ url:`/users/${id}/follow`, method:'POST' })
getFollowers: (id, page=1) => request<Paginated<FollowUserItem>>({ url:`/users/${id}/followers?page=${page}` })
getFollowing: (id, page=1) => request<Paginated<FollowUserItem>>({ url:`/users/${id}/following?page=${page}` })
```
- `getUser` 返回类型已是 `User`，补计数字段即可（后端已返回）
- 后端列表返回 `{data, meta}` 结构，与 `Paginated<T>` 对齐（复用现有 request 解包）

### D5. 跨页同步机制
- 唯一真相源 = followStore。所有展示关注状态/计数的组件订阅 store 而非本地 state
- 页面进入（useDidShow）时用最新接口数据 hydrate store（补偿并发/他端变更），但按钮态以 store 为准即时响应
- PostCard 作者、他人主页、列表项均读 `followStore.isFollowing(authorId)`；toggle 后 store 变更触发所有订阅组件重渲染

### D6. 入口改造（4 处，最小侵入）
- **PostCard**：作者头像/昵称包一层 `onClick` → `navigateTo user-profile?id=post.author.id`，`stopPropagation` 避免触发卡片进详情
- **detail 页作者**：作者信息区加 onClick → 他人主页
- **CommentItem**：评论者头像/昵称加 onClick → 他人主页
- **follow-list 项**：D3 已含
- 均复用现有 stopPropagation 模式，回归验证不误触

### D7. 私信占位
- 他人主页私信按钮 `disabled` 视觉 + onClick `Taro.showToast({title:'私信功能即将上线', icon:'none'})`
- 不引入路由，不建聊天页

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 乐观更新与后端结果不一致 | toggle 以后端返回 `{following}` 校正 store；失败回滚快照 |
| followStore 计数与真实值漂移（他端并发关注） | 页面 useDidShow 重新 hydrate 补偿；计数为展示值非强一致 |
| PostCard 头像点击与卡片进详情冲突 | stopPropagation（复用现有 action 区模式）|
| 自己关注自己按钮误显示 | 比对 authStore 当前用户 id，隐藏按钮；后端也拒绝自关注 |
| 未登录点关注体验 | toggle 前查 isLogin，触发 login()，不发请求 |
| follow-list 两用参数缺失/非法 | type 缺省 followers，userId 非法时空态提示 |
| 列表项 isFollowing 与 store 冲突 | 列表加载 hydrate 进 store，统一以 store 渲染 |
| 小程序 navigateTo 页面栈深度 10 限制 | 主页↔列表↔主页可能叠栈；列表项进主页用 navigateTo，深栈时接受（后续可 redirect 优化）|

## 测试策略

- **单元（vitest）**：followStore 的 toggle 乐观更新/回滚/未登录拦截逻辑（纯 store 逻辑，mock usersApi）；follow-list 的 type→数据源选择纯函数
- **tsc + weapp 编译**
- **真机冒烟**：4 入口跳转他人主页、关注/取关即时生效、跨页同步（主页关注→返回信息流按钮同步）、粉丝/关注列表分页与项内关注、我的页计数入口、自己主页无按钮、未登录关注引导、私信占位提示
