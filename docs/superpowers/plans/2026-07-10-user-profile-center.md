---
change: user-profile-center
design-doc: docs/superpowers/specs/2026-07-10-user-profile-center-design.md
base-ref: f8b987966aece23d769adde11caaffa1b77fcdef
---

# 个人中心 Implementation Plan（前端）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 个人中心（资料卡+Tab 我的帖子/收藏）、资料编辑独立页（头像上传）。后端收藏 DTO 已修复归档。

**Architecture:** 复用 usePagedList/PostCard/usersApi/uploadApi/authStore。收藏解包纯函数 + 变更字段收集纯函数（可测）。

**Tech Stack:** Taro 4、React、TS、bun、Zustand、vitest。

## Global Constraints

- 复用地基与前两 change 的 components/hooks/store/api、设计 token
- 后端：`GET/PATCH /users/profile`、`GET /posts/my`、`GET /users/me/favorites`（已返 DTO）、`POST /upload/image`
- 语言中文、单位 rpx、动效仅 transform/opacity

---

### Task 1: 类型与 API + 纯函数（TDD）

**Files:**
- Modify: `src/types/api.ts`、`src/services/api/interactions.ts`、`src/services/api/users.ts`
- Create: `src/utils/favorites.ts`、`src/utils/profile.ts`
- Test: `src/utils/__tests__/favorites.test.ts`、`src/utils/__tests__/profile.test.ts`

- [x] **Step 1: 类型**

`types/api.ts` 加：
```ts
export interface FavoriteItem { post: Post; favoritedAt: string }
export type PaginatedFavorites = Paginated<FavoriteItem>
```

- [x] **Step 2: API 调整**

`interactions.ts` 的 `getFavorites` 改分页 + 包裹类型：
```ts
getFavorites: (page = 1) => authRequest<PaginatedFavorites>({ url: `/users/me/favorites?page=${page}` }),
```
`users.ts` 确认 `updateProfile(body: Partial<...>)`、`getProfile()`。

- [x] **Step 3: 写失败测试（收藏解包 + 变更字段）**
```ts
// favorites.test.ts
import { unwrapFavorites } from '../favorites'
it('解包 post 数组', () => {
  const res = { data: [{ post: { id: 1 }, favoritedAt: 't' }], meta: { total:1,page:1,limit:10,totalPages:1 } } as any
  expect(unwrapFavorites(res).data).toEqual([{ id: 1 }])
})
// profile.test.ts
import { collectChanges } from '../profile'
it('只收集变更字段', () => {
  expect(collectChanges({ nickname:'a', bio:'x' }, { nickname:'a', bio:'y' })).toEqual({ bio:'y' })
})
it('无变更返回空对象', () => {
  expect(collectChanges({ nickname:'a' }, { nickname:'a' })).toEqual({})
})
```

- [x] **Step 4: 确认失败** — FAIL

- [x] **Step 5: 实现纯函数**
```ts
// favorites.ts
import type { PaginatedFavorites, Paginated, Post } from '../types/api'
export function unwrapFavorites(res: PaginatedFavorites): Paginated<Post> {
  return { data: res.data.map(i => i.post), meta: res.meta }
}
// profile.ts
export function collectChanges<T extends Record<string, any>>(orig: T, next: T): Partial<T> {
  const out: Partial<T> = {}
  for (const k in next) if (next[k] !== orig[k]) out[k] = next[k]
  return out
}
```

- [x] **Step 6: 确认通过 + Commit**
```bash
bunx tsc --noEmit && bunx vitest run src/utils
git add src/types src/services/api src/utils
git commit -m "feat(profile): 收藏包裹类型/解包与变更字段收集（TDD）"
```

---

### Task 2: 个人中心页

**Files:**
- Modify: `src/pages/profile/index.tsx`

- [x] **Step 1: 资料卡 + 未登录入口**

`usePagedList` 双数据源，`authStore` 取 user。已登录展示头像/昵称/简介 + 「编辑资料」按钮（navigateTo profile-edit）；未登录展示登录按钮（调 `login()` 成功刷新）。

- [x] **Step 2: Tab 切换 + 懒加载**

`activeTab: 'posts'|'favorites'`；`postsList = usePagedList(postsApi.findMyPosts)`、`favList = usePagedList(p => interactionsApi.getFavorites(p).then(unwrapFavorites))`；`loadedTabs` set 记录已加载，切入首次 reload。列表用 PostCard，空态提示。

- [x] **Step 3: 编译 + Commit**
```bash
bun run build:weapp
git add src/pages/profile
git commit -m "feat(profile): 个人中心资料卡 + 我的帖子/收藏 Tab 懒加载"
```

---

### Task 3: 资料编辑页

**Files:**
- Create: `src/pages/profile-edit/index.tsx`、`index.config.ts`
- Modify: `src/app.config.ts`

- [x] **Step 1: 注册路由 + 表单**

`app.config.ts` 加 `pages/profile-edit/index`。表单：昵称 Input、简介 Textarea、性别分段（保密/男/女）、头像 Image。初始值来自 authStore.user。

- [x] **Step 2: 头像上传**

`Taro.chooseImage` → `uploadApi.uploadImage(filePath)` 取 url → 本地预览 state。

- [x] **Step 3: 保存**

`collectChanges(原始, 当前)` → 若空提示无改动 → `usersApi.updateProfile(changed)` → 成功 `authStore.setAuth(token, 新user)` → `Taro.navigateBack()`；失败 showToast。

- [x] **Step 4: 编译 + Commit**
```bash
bun run build:weapp
git add src/pages/profile-edit src/app.config.ts
git commit -m "feat(profile): 资料编辑页 + 头像上传"
```

---

### Task 4: 全量验证

- [x] **Step 1:** `bunx tsc --noEmit && bunx vitest run && bun run build:weapp` 全绿
- [x] **Step 2:** Commit 剩余

---

## Self-Review
- Spec 覆盖：profile-center→Task2；profile-edit→Task3；my-content→Task1-2。
- 纯函数 unwrapFavorites/collectChanges 有单测。
- 已知：真机验证收藏 DTO 生效、头像上传、资料保存。
