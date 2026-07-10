# Brainstorm Summary

- Change: user-profile-center
- Date: 2026-07-10

## 确认的技术方案

**前端（小程序）**
- 个人中心 `pages/profile`：资料卡（头像/昵称/简介）+ 编辑入口；未登录展示登录入口；下方 Tab「我的帖子｜我的收藏」各用 usePagedList 独立分页 + 懒加载，复用 PostCard
- 资料编辑 `pages/profile-edit`（独立页，用户确认）：表单昵称/简介/性别分段 + 头像（chooseImage → uploadApi.uploadImage → 预览），保存 usersApi.updateProfile(变更字段) → 更新 authStore → 返回
- 收藏解包：后端补 DTO 后返回 {data:{post,favoritedAt}[]}，前端 map 出 post[] 喂 PostCard（纯逻辑可测）
- 类型：FavoriteItem{post,favoritedAt}、PaginatedFavorites；updateProfile 用 Partial

**后端（go-service 独立 openspec change，用户确认方案 C 保持数据一致性）**
- 收藏接口 GET /users/me/favorites 的 FavoriteItem.post 从原始 posts.Post 改为规范 DTO（小写字段 + author），与 PostResponse 一致

**编排顺序（用户确认）**：先改后端收藏 DTO → 重启 → 前端消费规范 DTO → 真机验证

## 关键取舍与风险

- 收藏返回原始 GORM 模型 PascalCase：选方案 C 后端补 DTO（保持所有列表接口 DTO 一致性），而非前端归一化兜底
- PATCH profile 动态 map → 前端只传变更字段（Partial）
- 头像上传依赖又拍云 → 失败提示保留原头像
- Tab 切换重复请求 → 懒加载 + 已加载缓存

## 测试策略

- 单元（vitest）：收藏解包、变更字段收集（纯逻辑）
- tsc + weapp 编译
- 真机冒烟：资料展示、Tab 切换、编辑保存、头像上传、我的帖子/收藏

## 非目标（YAGNI）

不做他人主页、粉丝/关注、消息中心。

## Spec Patch

无（open 阶段 delta spec 已含收藏容错场景，design 阶段未新增需求）。
