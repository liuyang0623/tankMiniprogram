## Why

「摆烂随笔」已实现浏览、详情、互动、登录，但用户没有「个人空间」——无法查看和编辑自己的资料、找回自己发过的帖子、管理收藏。这是社区产品的基本闭环，也是后续发布功能（`article-publish-richtext`）的自然承载入口（发布依赖登录态，个人中心是登录后的主场）。

本变更是四拆分 change 的第 4 个（按用户优先级提前到发布之前），复用地基层与前两个 change 建立的设计系统、请求层、鉴权、`usePagedList` 与列表组件。

## What Changes

- **个人中心页**：完善 `pages/profile`，展示当前用户资料（头像、昵称、简介），未登录时展示登录入口
- **资料编辑**：编辑昵称、简介、性别、头像（头像走 upload 接口），提交 `PATCH /users/profile` 部分更新
- **我的帖子**：分页展示当前用户已发布帖子（`GET /posts/my`），点击进详情
- **我的收藏**：分页展示收藏的帖子（`GET /users/me/favorites`），点击进详情
- **类型补充**：收藏列表返回 `{post, favoritedAt}` 包裹结构的类型

## Capabilities

### New Capabilities

- `profile-center`: 个人中心页（资料展示、未登录入口、我的帖子/收藏入口）
- `profile-edit`: 资料编辑（昵称/简介/性别/头像，PATCH 部分更新）
- `my-content`: 我的帖子与我的收藏列表（分页，复用 usePagedList）

### Modified Capabilities

无（复用地基与既有能力，不改其需求）

## Impact

- **完善页面**：`src/pages/profile`（当前为占位）
- **新增页面**：资料编辑页 `src/pages/profile-edit`、我的帖子/收藏列表页（或个人中心内 Tab 切换）
- **复用**：`usePagedList`、`PostCard`、地基 components/store/api、`useAuthGuard`、`uploadApi`
- **后端契约**：消费 `GET/PATCH /users/profile`、`GET /posts/my`、`GET /users/me/favorites`、`POST /upload/image`（均已实现）
- **已知契约风险**：`GET /users/me/favorites` 返回的 `post` 为 GORM 原始模型（PascalCase 无小写 json tag），可能需后端补 DTO（届时走 go-service 修复，参照 `fix-interactions-bugs` 模式）
