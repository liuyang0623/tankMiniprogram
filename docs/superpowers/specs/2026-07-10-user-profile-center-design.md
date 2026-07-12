---
comet_change: user-profile-center
role: technical-design
canonical_spec: openspec
archived-with: 2026-07-12-user-profile-center
status: final
---

# user-profile-center 技术设计

> 深化 `openspec/changes/user-profile-center/design.md`。需求与验收场景以 `specs/*/spec.md` 为准。

## 1. 概览

个人中心闭环，复用地基与前两个 change 的设计系统、请求层、鉴权、usePagedList、PostCard、uploadApi、authStore。**前后端联动**：先在 go-service 补收藏 DTO（保持数据一致性，用户确认方案 C），再前端消费。

```
pages/profile(个人中心: 资料卡 + Tab[我的帖子|我的收藏])
pages/profile-edit(资料编辑: 表单 + 头像上传)
   └─ usePagedList / PostCard / usersApi / uploadApi / authStore
go-service: GET /users/me/favorites 补 FavoriteResponse DTO
```

## 2. 后端改动（go-service 独立 openspec change）

- **收藏 DTO**：`FavoriteItem.Post` 从 `posts.Post`（原始 GORM 模型，PascalCase）改为返回 `PostResponse`（小写字段 + author），与帖子列表一致
- 复用 posts 包已有的 `toPostResponse`（或等价）转换
- 走独立 change（参照 `fix-interactions-bugs`），先改后端重启，前端再消费

## 3. 前端：个人中心页（`pages/profile`）

- **资料卡**：已登录展示 authStore.user 的头像/昵称/简介 + 「编辑资料」入口（navigateTo profile-edit）
- **未登录**：展示登录按钮，点击 `login()`，成功后刷新
- **Tab**：`activeTab: 'posts' | 'favorites'`，切换数据源
  - 我的帖子：`usePagedList(postsApi.findMyPosts)`
  - 我的收藏：`usePagedList(page => favoritesUnwrap(page))`
- **懒加载**：记录各 Tab 是否已加载（`loadedTabs` set），首次切入才 reload，切回不重复请求
- 列表复用 PostCard，空态提示

## 4. 前端：资料编辑页（`pages/profile-edit`）

- 表单：昵称（input）、简介（textarea）、性别（分段：保密/男/女）、头像（Image + chooseImage）
- 头像流程：`Taro.chooseImage` → `uploadApi.uploadImage(filePath)` 取 URL → 本地预览
- 保存：收集**变更字段**（与初始值 diff）→ `usersApi.updateProfile(changed)` → 成功更新 `authStore`（setAuth 保留 token 换 user）→ `Taro.navigateBack`
- 失败：showToast，不改原资料

## 5. 收藏解包（`src/utils/favorites.ts`）

```ts
// 从 {data:{post,favoritedAt}[], meta} 提取 post 数组，喂给 usePagedList
export function unwrapFavorites(res: PaginatedFavorites): Paginated<Post> {
  return { data: res.data.map(item => item.post), meta: res.meta }
}
```
纯函数，可单测。

## 6. 类型（`src/types/api.ts`）

- `FavoriteItem { post: Post; favoritedAt: string }`
- `PaginatedFavorites = Paginated<FavoriteItem>`
- `usersApi.updateProfile(body: Partial<Pick<User,'nickname'|'avatar'|'bio'|'gender'>>)`
- 变更字段收集：`collectChanges(orig, next)` 返回仅变化的字段（纯逻辑）

## 7. 测试策略

- 单元（vitest）：`unwrapFavorites` 解包、`collectChanges` 变更字段收集
- tsc + weapp 编译
- 真机冒烟：资料展示、未登录入口、Tab 切换懒加载、编辑保存、头像上传、我的帖子/收藏（验证收藏 DTO 生效）

## 8. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 收藏原始模型 PascalCase | 后端补 DTO（方案 C），前端消费规范结构 |
| PATCH profile 动态 map | 前端只传变更字段 Partial |
| 头像上传依赖又拍云 | 失败提示，保留原头像 |
| Tab 切换重复请求 | 懒加载 + loadedTabs 缓存 |
| authStore 更新丢 token | updateProfile 后用 setAuth(原 token, 新 user) |

## 9. 编排顺序

1. go-service 独立 change 补收藏 DTO → 重启后端 → curl 验证
2. 前端：类型 + 收藏解包 + 个人中心页 + 编辑页
3. 真机联调验证

## 10. 非目标（YAGNI）

不做他人主页、粉丝/关注、消息中心、多端。

