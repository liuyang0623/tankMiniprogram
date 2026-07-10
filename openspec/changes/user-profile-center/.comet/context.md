# Comet Design Handoff

- Change: user-profile-center
- Phase: design
- Mode: compact
- Context hash: b6074067b201955933a41fb268bc187fd142255e84c0ac5d515f26cc026c8d87

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/user-profile-center/proposal.md

- Source: openspec/changes/user-profile-center/proposal.md
- Lines: 1-33
- SHA256: 4997fe8f065a496a8cae4244472dfffa72df8c7162a3dfb58d48632791d4182a

```md
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

```

## openspec/changes/user-profile-center/design.md

- Source: openspec/changes/user-profile-center/design.md
- Lines: 1-46
- SHA256: d241c88d71499f47e08791da4cf94dc5a23721a67a8218bee2aa6dc04159bdd0

```md
## Context

「摆烂随笔」个人中心，复用地基层与前两个 change 的设计系统、请求层、鉴权、`usePagedList`、`PostCard`、`useAuthGuard`、`uploadApi`。后端 profile/我的帖子/收藏接口均已实现。

契约要点（已核对 go-service）：
- `GET /users/profile` 返回 User；`PATCH /users/profile` 接受部分字段 map
- `GET /posts/my` 返回 `PaginatedResult`（已是 DTO，同帖子列表）
- `GET /users/me/favorites` 返回 `{data: {post, favoritedAt}[], meta}`，其中 `post` 是 GORM 原始模型（**PascalCase 无小写 json tag，已知风险**）

## Goals / Non-Goals

**Goals:** 个人中心（资料展示+登录入口+Tab 我的帖子/收藏）、独立资料编辑页、头像上传。
**Non-Goals:** 不做他人主页、粉丝/关注、消息中心；不改后端（收藏 DTO 问题若真机暴露再走 go-service 修复）。

## Decisions

**D1. 个人中心单页 Tab 切换（用户确认）**
- `pages/profile` 顶部资料卡 + 编辑入口，下方 Tab「我的帖子｜我的收藏」，各用 `usePagedList` 独立分页，切 Tab 切换数据源。
- 未登录：资料卡替换为登录入口（`useAuthGuard` 或直接 login），登录后刷新。

**D2. 资料编辑独立页（用户确认）**
- 新增 `pages/profile-edit`：表单（昵称/简介/性别/头像），保存 `usersApi.updateProfile(部分字段)`，成功更新 `authStore` 并返回。
- 头像：`Taro.chooseImage` → `uploadApi.uploadImage(filePath)` 取 URL → 随保存提交。

**D3. 收藏解包**
- `favoritesApi` 返回 `{post, favoritedAt}[]`，前端 `usePagedList` 的 fetchPage 里 map 出 `post` 数组喂给 PostCard；或保留包裹结构由列表项解包。
- 因 `post` 可能是 PascalCase，先按现有 Post 类型消费，真机验证；若字段不匹配（如 `Title` vs `title`），走 go-service 加收藏 DTO（参照 fix-interactions-bugs）。

**D4. 复用 usePagedList + PostCard**
- 我的帖子直接 `usePagedList(postsApi.findMyPosts)`；收藏 `usePagedList(page => favoritesApi(page).then(unwrap))`。

## Risks / Trade-offs

- [收藏 post 为 GORM 原始模型 PascalCase] → 先消费，真机验证；不匹配则后端补 DTO（已知模式）
- [PATCH profile 为动态 map] → 前端只传变更字段，类型上用 Partial
- [头像上传依赖又拍云配置] → 上传失败给提示，保留原头像
- [Tab 切换重复请求] → 各 Tab 首次进入才加载，切回不重复请求（懒加载 + 缓存已加载状态）

## Migration Plan

无。新分支开发，复用既有基础。

## Open Questions

- 收藏 post 字段名是否与 Post 类型一致（真机联调确认）
- 性别编辑用选择器还是分段控件（build 阶段定，倾向简单分段）

```

## openspec/changes/user-profile-center/tasks.md

- Source: openspec/changes/user-profile-center/tasks.md
- Lines: 1-29
- SHA256: 657444cc65adde6714daa4dae3c217bd8c3d086d386f3ea94884e8099ef97e69

```md
# Implementation Tasks — user-profile-center

## 1. API 与类型

- [ ] 1.1 `types/api.ts` 补收藏包裹类型 `FavoriteItem { post: Post; favoritedAt: string }`、`PaginatedFavorites`
- [ ] 1.2 `services/api/users.ts` 确认 `getProfile`/`updateProfile(部分字段)` 签名；`interactions.ts` 确认 `getFavorites` 返回分页
- [ ] 1.3 收藏解包工具：从 `{post, favoritedAt}[]` 提取 `post[]`

## 2. 个人中心页（profile-center）

- [ ] 2.1 资料卡：头像/昵称/简介 + 编辑入口（已登录）
- [ ] 2.2 未登录入口：登录按钮，走 login，成功刷新
- [ ] 2.3 Tab 切换「我的帖子｜我的收藏」组件
- [ ] 2.4 我的帖子 Tab：`usePagedList(postsApi.findMyPosts)` + PostCard + 空态
- [ ] 2.5 我的收藏 Tab：`usePagedList(收藏解包)` + PostCard + 空态
- [ ] 2.6 Tab 懒加载（首次进入才请求，切回不重复）

## 3. 资料编辑页（profile-edit）

- [ ] 3.1 新增 `pages/profile-edit`（注册路由），表单：昵称/简介/性别
- [ ] 3.2 头像选择 + 上传：`Taro.chooseImage` → `uploadApi.uploadImage` → 预览
- [ ] 3.3 保存：`usersApi.updateProfile(变更字段)` → 更新 authStore → 返回
- [ ] 3.4 保存/上传失败提示

## 4. 验证

- [ ] 4.1 单元测试：收藏解包工具、变更字段收集逻辑
- [ ] 4.2 tsc 类型校验 + weapp 编译通过
- [ ] 4.3 微信开发者工具冒烟：个人中心资料、Tab 切换、编辑保存、头像上传、我的帖子/收藏（真机验证收藏 post 字段是否匹配）

```

## openspec/changes/user-profile-center/specs/my-content/spec.md

- Source: openspec/changes/user-profile-center/specs/my-content/spec.md
- Lines: 1-24
- SHA256: 66649c30a586a7d0d7e25a22015d34c297da946fa4d7a40b3de2311e06edd3f2

```md
## ADDED Requirements

### Requirement: 我的帖子列表

系统 SHALL 通过 `GET /posts/my` 分页加载当前用户的帖子，复用统一分页与卡片展示，支持加载更多与空态。

#### Scenario: 加载我的帖子

- **WHEN** 用户查看「我的帖子」
- **THEN** 系统 SHALL 分页请求并以卡片展示，支持上拉加载更多

### Requirement: 我的收藏列表

系统 SHALL 通过 `GET /users/me/favorites` 分页加载收藏的帖子，展示帖子卡片，支持加载更多与空态。收藏返回为 `{post, favoritedAt}` 包裹结构，前端 SHALL 正确解包 `post` 后展示。

#### Scenario: 加载我的收藏

- **WHEN** 用户查看「我的收藏」
- **THEN** 系统 SHALL 分页请求并解包 `post` 以卡片展示

#### Scenario: 收藏 post 字段结构容错

- **WHEN** 收藏接口返回的 `post` 字段结构与前端 Post 类型不完全一致
- **THEN** 系统 SHALL 尽力展示可用字段，不因单条数据结构差异导致整页崩溃（后端如返回原始模型字段名不一致，作为已知项在联调修复）

```

## openspec/changes/user-profile-center/specs/profile-center/spec.md

- Source: openspec/changes/user-profile-center/specs/profile-center/spec.md
- Lines: 1-34
- SHA256: be59ab72b92b20542ea52f4742a45e90efa796a53a005606d2ca5012ace7cd70

```md
## ADDED Requirements

### Requirement: 个人中心资料展示

系统 SHALL 在个人中心页展示当前登录用户的资料（头像、昵称、简介）；未登录时展示登录入口，点击触发微信登录。

#### Scenario: 已登录展示资料

- **WHEN** 已登录用户进入个人中心
- **THEN** 系统 SHALL 展示其头像、昵称、简介，以及编辑入口与「我的帖子/我的收藏」入口

#### Scenario: 未登录展示登录入口

- **WHEN** 未登录用户进入个人中心
- **THEN** 系统 SHALL 展示登录入口，点击后走微信登录，成功后展示资料

### Requirement: 我的帖子与我的收藏（Tab 切换）

系统 SHALL 在个人中心以 Tab 切换展示「我的帖子」（`GET /posts/my`）与「我的收藏」（`GET /users/me/favorites`），均分页加载，点击项进入详情。

#### Scenario: 切换查看我的帖子

- **WHEN** 用户切到「我的帖子」Tab
- **THEN** 系统 SHALL 分页展示其已发布帖子，支持加载更多，点击进详情

#### Scenario: 切换查看我的收藏

- **WHEN** 用户切到「我的收藏」Tab
- **THEN** 系统 SHALL 分页展示其收藏的帖子，点击进详情

#### Scenario: 空态

- **WHEN** 我的帖子或收藏为空
- **THEN** 系统 SHALL 展示相应空态提示

```

## openspec/changes/user-profile-center/specs/profile-edit/spec.md

- Source: openspec/changes/user-profile-center/specs/profile-edit/spec.md
- Lines: 1-29
- SHA256: bb4561c9a1f4cd286f275034515666365c30782765459472679c246e3ff2a5f1

```md
## ADDED Requirements

### Requirement: 资料编辑

系统 SHALL 提供独立的资料编辑页，允许用户修改昵称、简介、性别、头像，提交 `PATCH /users/profile` 做部分更新，保存后返回并刷新个人中心展示。

#### Scenario: 编辑并保存资料

- **WHEN** 用户在编辑页修改昵称/简介/性别并保存
- **THEN** 系统 SHALL 提交变更字段，成功后更新本地用户态并返回个人中心

#### Scenario: 保存失败提示

- **WHEN** 资料保存接口失败
- **THEN** 系统 SHALL 提示保存失败，不改变原有资料

### Requirement: 头像上传

系统 SHALL 支持在资料编辑页选择图片作为头像，先经 `POST /upload/image` 上传取得 URL，再随资料一并保存。

#### Scenario: 更换头像

- **WHEN** 用户选择一张图片作为新头像
- **THEN** 系统 SHALL 上传该图片取得 URL，并在保存资料时使用该 URL

#### Scenario: 上传失败

- **WHEN** 头像图片上传失败
- **THEN** 系统 SHALL 提示上传失败，保留原头像

```
