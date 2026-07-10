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
