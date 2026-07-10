# Comet Design Handoff

- Change: article-feed-and-detail
- Phase: design
- Mode: compact
- Context hash: 723d13b4f859a4c09ec81f4dc202abd6f28792a2e422258a9cf1252d4b14c590

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/article-feed-and-detail/proposal.md

- Source: openspec/changes/article-feed-and-detail/proposal.md
- Lines: 1-34
- SHA256: 430ce3280111202c3cf70936fc97b2e7ec864a100fb299143a1f869775568171

```md
## Why

地基层（`miniprogram-foundation`）已就绪：脚手架、设计系统、请求层、鉴权都可复用，但目前首页只有一个最小信息流骨架，文章详情、评论、点赞收藏等核心浏览与互动能力尚未实现。「摆烂随笔」作为博客交流社区，用户的核心路径是「刷信息流 → 进详情读文章 → 点赞/收藏/评论」，这是产品价值的主干，需优先落地。

本变更是四拆分 change 的第 2 个，依赖并复用地基层的 `services/api`、`components`、`store` 与设计 token。

## What Changes

- **信息流首页**：完善 `pages/index`，支持分页加载、下拉刷新、上拉加载更多、骨架屏与空/错误态，卡片展示标题/摘要/作者/封面/话题/互动计数
- **文章详情页**：新增 `pages/detail`，展示完整文章（富文本 `rich-text` 渲染 `content`）、作者信息、话题、浏览/点赞/评论计数，展示当前用户的 `isLiked`/`isFavorited` 状态
- **点赞/收藏交互**：详情页点赞、收藏按钮，toggle 语义（后端返回 `{liked}`/`{favorited}`），乐观更新 + 失败回滚，未登录时走登录守卫
- **评论功能**：详情页评论列表（分页）、发表评论、嵌套回复（`parentId`）、删除自己的评论；未登录可看、发表需登录
- **类型补充**：为地基层 `types/api.ts` 补充详情用户态字段（`Post.isLiked`/`isFavorited`）、分页 `totalPages`、评论分页类型（属地基契约的增量补充，非修改既有行为）

## Capabilities

### New Capabilities

- `article-feed`: 信息流首页的分页加载、下拉刷新、上拉加载更多、加载态与卡片展示
- `article-detail`: 文章详情页的富文本渲染、作者/话题/计数展示与用户互动态
- `post-interactions`: 点赞、收藏（toggle）与评论（列表/发表/嵌套回复/删除）交互

### Modified Capabilities

<!-- 无既有 spec 需求变更。data-access 的类型补充属新增字段，不改变既有解包/鉴权行为，随本 change 的实现落地，不单列 delta。 -->

## Impact

- **新增页面**：`src/pages/detail`（含 config/scss）
- **完善页面**：`src/pages/index`（分页/下拉刷新/加载更多）
- **新增组件**：文章卡片、评论项、互动栏等（复用地基 Button/Card/Avatar/Tag/Skeleton）
- **复用地基**：`services/api/{posts,interactions}`、`store`、设计 token 与动效
- **类型增量**：`src/types/api.ts` 补 `isLiked/isFavorited/totalPages` 与评论分页类型
- **后端契约**：消费 `GET /posts`、`GET /posts/:id`、`GET /posts/:id/comments`、`POST /posts/:id/like`、`POST /posts/:id/favorite`、`POST /comments`、`DELETE /comments/:id`（均已实现）

```

## openspec/changes/article-feed-and-detail/design.md

- Source: openspec/changes/article-feed-and-detail/design.md
- Lines: 1-59
- SHA256: f9d44f7df75f951302570cbe86aff48f63015b9e305f2e2583c6489434a5577b

```md
## Context

「摆烂随笔」地基层（`miniprogram-foundation`）已归档：脚手架、设计系统、请求层（`services/api/{posts,interactions}`）、Zustand store、鉴权守卫均可复用。本变更在其上实现核心浏览互动路径：信息流、详情、点赞收藏评论。

后端契约已核对（go-service）：
- `GET /posts` 分页 `{data,meta:{total,page,limit,totalPages}}`
- `GET /posts/:id` 返回 `PostResponse`，登录时带 `isLiked`/`isFavorited`
- `POST /posts/:id/like` → `{liked}`；`/favorite` → `{favorited}`（toggle）
- `GET /posts/:id/comments` 分页 `PaginatedComments`；`Comment` 带 `replies`
- `POST /comments` `{postId,content,parentId?}`；`DELETE /comments/:id`

## Goals / Non-Goals

**Goals:**
- 信息流：分页、下拉刷新、上拉加载更多、骨架/空/错误态
- 详情页：`rich-text` 渲染、作者/话题/计数、用户互动态
- 点赞/收藏：toggle + 乐观更新 + 失败回滚 + 未登录守卫
- 评论：列表分页、发表、两层嵌套回复、删除本人评论

**Non-Goals:**
- 不做发布/编辑（change 3）、个人中心（change 4）、搜索/推荐
- 不改后端；地基契约类型的字段补充随本 change 落地

## Decisions

**D1. 详情用独立页 `pages/detail`（而非弹层）**
- 理由：长文富文本 + 评论列表体验更好，可前进后退，符合小程序习惯。
- 导航：`Taro.navigateTo({url:'/pages/detail/index?id=xxx'})`，详情页 `useRouter` 取 id。

**D2. 点赞/收藏乐观更新 + 失败回滚**
- 理由：即时反馈，交互跟手。点击立即改本地态与计数，接口成功以返回 `{liked}`/`{favorited}` 为准，失败回滚并提示。
- 实现：详情页局部 state 管理 liked/favorited/count，配合 `useAuthGuard` 处理未登录。

**D3. 评论两层结构**
- 理由：顶层评论 + 一层回复，覆盖绝大多数场景且性能好。后端 `Comment.replies` 可能多层，前端展示时把更深层平铺到回复层。
- 数据：`getComments` 分页取顶层，回复随 `replies` 返回或按需展开。

**D4. 类型增量补充（不改地基既有行为）**
- `Post` 补 `isLiked?`/`isFavorited?`；`PaginationMeta` 补 `totalPages`；新增评论分页类型 `PaginatedComments`。
- 归档时这些字段并入 data-access 主 spec 的对应类型说明。

**D5. 列表分页状态管理**
- 首页与评论列表各自维护 `{list,page,hasMore,loading}` 局部状态；不引入全局列表 store（YAGNI，列表是页面级状态）。

## Risks / Trade-offs

- [富文本 rich-text 对部分 HTML 标签/样式支持有限] → 详情页做基础样式兜底；复杂富文本回显在 publish change 联调时进一步验证
- [乐观更新与后端最终状态不一致] → 以接口返回的 toggle 状态为准覆盖本地态，失败回滚
- [评论深层嵌套平铺可能丢失层级信息] → 两层足够表达「评论-回复」关系，@某人 用文本前缀表达更深引用
- [服务端未启动，真实数据联调受限] → 复用地基已验证的请求层错误处理，Mock/兜底 UI 已就绪，端到端联调待服务端

## Migration Plan

无线上迁移。新分支开发，独立页面与组件，不破坏地基既有页面。回滚：change 可废弃或 revert。

## Open Questions

- 评论「加载更多」与「回复展开」的分页策略细节（build 阶段按后端返回结构确定）
- 详情页 `rich-text` 的图片点击预览是否本期做（倾向简单实现或留后续）

```

## openspec/changes/article-feed-and-detail/tasks.md

- Source: openspec/changes/article-feed-and-detail/tasks.md
- Lines: 1-45
- SHA256: a05924da886c667a7cc8d055ad9ac7b741a3d63d748d74a5227edb7a76d2e1a8

```md
# Implementation Tasks — article-feed-and-detail

## 1. 类型与 API 增量

- [ ] 1.1 `types/api.ts` 补充：`Post.isLiked?/isFavorited?`、`PaginationMeta.totalPages`、评论分页类型 `PaginatedComments`
- [ ] 1.2 校验 `services/api/posts.ts`、`interactions.ts` 方法签名与后端契约一致（点赞/收藏返回 `{liked}`/`{favorited}`，评论分页）

## 2. 信息流首页（article-feed）

- [ ] 2.1 首页分页状态管理：`{list,page,hasMore,loading,refreshing,error}`
- [ ] 2.2 首屏加载 + 骨架屏 + 空态 + 错误重试
- [ ] 2.3 下拉刷新（`onPullDownRefresh` 或 ScrollView refresher）重置第一页
- [ ] 2.4 上拉加载更多（触底加载下一页），到底展示「没有更多了」
- [ ] 2.5 帖子卡片组件：标题/摘要/作者/封面/话题/点赞评论数，点击进详情

## 3. 文章详情页（article-detail）

- [ ] 3.1 新增 `pages/detail`（index.tsx/config/scss），注册到 app.config.ts
- [ ] 3.2 从路由取 id，加载 `GET /posts/:id`，骨架/错误态
- [ ] 3.3 `rich-text` 渲染 content，展示标题/作者/话题/浏览计数
- [ ] 3.4 展示当前用户 `isLiked`/`isFavorited` 初始态
- [ ] 3.5 富文本图片预览：解析 content 的 `<img>`，点击 `Taro.previewImage` 全屏预览

## 4. 点赞与收藏（post-interactions）

- [ ] 4.1 详情页互动栏组件：点赞、收藏按钮 + 计数
- [ ] 4.2 乐观更新：点击即变态与计数，接口返回以 `{liked}`/`{favorited}` 为准
- [ ] 4.3 失败回滚 + Toast 提示
- [ ] 4.4 未登录时 `useAuthGuard` 引导登录后继续

## 5. 评论（post-interactions）

- [ ] 5.1 评论列表加载（`GET /posts/:id/comments` 分页）+ 加载更多
- [ ] 5.2 评论项组件：作者/内容/时间，两层结构（顶层 + 回复列表）
- [ ] 5.3 发表顶层评论（输入框 + 提交，未登录引导登录）
- [ ] 5.4 回复某评论（携带 parentId），回复展示在该评论下
- [ ] 5.5 删除本人评论（`DELETE /comments/:id`，从列表移除）
- [ ] 5.6 评论递归渲染：CommentItem 递归支持任意深度，视觉限深后 `@昵称` 前缀
- [ ] 5.7 评论点赞：点赞按钮 + 计数 + 本地乐观态，预留 `interactions.likeComment(id)` 接口

## 6. 验证

- [ ] 6.1 单元测试：`usePagedList` hook（加载/加载更多/刷新/到底/错误）、乐观更新回滚逻辑
- [ ] 6.2 tsc 类型校验 + weapp 编译通过
- [ ] 6.3 微信开发者工具冒烟：信息流滚动/刷新、进详情、rich-text、图片预览、点赞收藏、评论回复/评论点赞（服务端未起时验证兜底 UI 与交互逻辑）

```

## openspec/changes/article-feed-and-detail/specs/article-detail/spec.md

- Source: openspec/changes/article-feed-and-detail/specs/article-detail/spec.md
- Lines: 1-52
- SHA256: 1b3a7ab2eff8b327a2c3ae4c6f604ebfe3f591d5cbb872084f06409e090be7ee

```md
## ADDED Requirements

### Requirement: 文章详情页导航

系统 SHALL 支持从信息流卡片点击进入独立的文章详情页（`Taro.navigateTo` 携带帖子 id），支持返回上一页。

#### Scenario: 从信息流进入详情

- **WHEN** 用户点击信息流中的某张帖子卡片
- **THEN** 系统 SHALL 跳转到详情页并加载该帖子完整内容

#### Scenario: 详情加载失败

- **WHEN** 详情接口请求失败
- **THEN** 系统 SHALL 展示错误提示与重试入口

### Requirement: 富文本内容渲染

系统 SHALL 使用 `rich-text` 组件渲染帖子的 `content`（富文本 HTML），并展示标题、作者、话题、浏览/点赞/评论计数。

#### Scenario: 渲染富文本正文

- **WHEN** 详情页加载成功且帖子含富文本内容
- **THEN** 系统 SHALL 以 `rich-text` 正确渲染图文混排内容

### Requirement: 展示当前用户互动态

已登录用户查看详情时，系统 SHALL 依据后端返回的 `isLiked`/`isFavorited` 展示已赞/已收藏状态。

#### Scenario: 已登录展示已赞状态

- **WHEN** 已登录用户进入曾点赞过的帖子详情
- **THEN** 系统 SHALL 将点赞按钮展示为已点赞态

#### Scenario: 未登录浏览详情

- **WHEN** 未登录用户进入详情页
- **THEN** 系统 SHALL 正常展示内容，互动按钮为未激活态

### Requirement: 富文本图片预览

系统 SHALL 解析富文本 `content` 中的图片，支持点击图片全屏预览（可缩放、可左右滑动切换）。

#### Scenario: 点击正文图片预览

- **WHEN** 用户点击详情正文中的某张图片
- **THEN** 系统 SHALL 调用 `Taro.previewImage` 以该图为当前项、正文全部图片为列表全屏预览

#### Scenario: 无图片时不显示预览入口

- **WHEN** 帖子正文不含图片
- **THEN** 系统 SHALL 正常渲染文本，不提供图片预览交互

```

## openspec/changes/article-feed-and-detail/specs/article-feed/spec.md

- Source: openspec/changes/article-feed-and-detail/specs/article-feed/spec.md
- Lines: 1-43
- SHA256: e7c2bb07af7776952f0b7246343630ac45f346a1d3770439357385b5760e7b22

```md
## ADDED Requirements

### Requirement: 信息流分页加载

系统 SHALL 在首页展示已发布帖子列表，通过 `GET /posts` 分页加载，滚动到底部时自动加载下一页，无更多数据时展示到底提示。

#### Scenario: 首屏加载帖子列表

- **WHEN** 用户进入首页
- **THEN** 系统 SHALL 请求第一页帖子并以卡片列表展示（标题、摘要、作者、话题、点赞/评论数）

#### Scenario: 上拉加载更多

- **WHEN** 用户滚动到列表底部且存在下一页
- **THEN** 系统 SHALL 加载并追加下一页帖子

#### Scenario: 无更多数据

- **WHEN** 已加载到最后一页
- **THEN** 系统 SHALL 展示「没有更多了」提示，不再发起加载

### Requirement: 下拉刷新

系统 SHALL 支持下拉刷新首页信息流，刷新时重置为第一页数据。

#### Scenario: 下拉刷新列表

- **WHEN** 用户在首页下拉
- **THEN** 系统 SHALL 重新加载第一页并替换当前列表，结束后收起刷新态

### Requirement: 加载态与异常态

系统 SHALL 在首屏加载时展示骨架屏，加载失败时展示可重试的错误态，无数据时展示空态。

#### Scenario: 首屏骨架屏

- **WHEN** 首页首屏数据加载中
- **THEN** 系统 SHALL 展示骨架屏列表

#### Scenario: 加载失败可重试

- **WHEN** 帖子列表请求失败
- **THEN** 系统 SHALL 展示错误提示与重试入口，点击重试重新加载

```

## openspec/changes/article-feed-and-detail/specs/post-interactions/spec.md

- Source: openspec/changes/article-feed-and-detail/specs/post-interactions/spec.md
- Lines: 1-85
- SHA256: bd553132d0c4c0c5a3b8be40b484b1fa2c90a0589afcb57218c397f6c0caa386

[TRUNCATED]

```md
## ADDED Requirements

### Requirement: 点赞与收藏（toggle）

系统 SHALL 支持在详情页对帖子点赞与收藏，采用 toggle 语义（`POST /posts/:id/like` 返回 `{liked}`、`/favorite` 返回 `{favorited}`）。交互采用乐观更新：点击即变更按钮态与计数，接口失败则回滚。未登录时先引导登录。

#### Scenario: 已登录点赞乐观更新

- **WHEN** 已登录用户点击未点赞帖子的点赞按钮
- **THEN** 系统 SHALL 立即将按钮置为已赞态并计数 +1，接口成功后以返回状态为准

#### Scenario: 点赞失败回滚

- **WHEN** 点赞接口请求失败
- **THEN** 系统 SHALL 回滚按钮态与计数到操作前，并提示失败

#### Scenario: 未登录点赞引导登录

- **WHEN** 未登录用户点击点赞或收藏
- **THEN** 系统 SHALL 触发登录守卫引导登录，登录成功后继续该操作

### Requirement: 评论列表

系统 SHALL 在详情页展示帖子评论列表（`GET /posts/:id/comments` 分页），每条评论展示作者、内容、时间，未登录可查看。

#### Scenario: 展示评论列表

- **WHEN** 详情页加载
- **THEN** 系统 SHALL 加载并展示该帖子的评论列表，支持加载更多

### Requirement: 发表评论与嵌套回复

系统 SHALL 支持登录用户发表评论与回复（`POST /comments`，回复携带 `parentId`）。回复展示为两层结构：顶层评论 + 其下回复列表（更深层回复平铺到该层）。

#### Scenario: 发表顶层评论

- **WHEN** 登录用户在详情页输入内容并提交评论
- **THEN** 系统 SHALL 提交评论并将其展示在评论列表中

#### Scenario: 回复某条评论

- **WHEN** 登录用户对某条顶层评论发表回复
- **THEN** 系统 SHALL 携带 `parentId` 提交，并将回复展示在该评论的回复列表下

#### Scenario: 未登录发表评论引导登录

- **WHEN** 未登录用户尝试发表评论
- **THEN** 系统 SHALL 引导登录后再提交

### Requirement: 删除自己的评论

系统 SHALL 允许用户删除自己发表的评论（`DELETE /comments/:id`），删除后从列表移除。

#### Scenario: 删除本人评论

- **WHEN** 用户删除自己发表的评论
- **THEN** 系统 SHALL 调用删除接口并从评论列表移除该条

### Requirement: 评论点赞（前端 + 预留接口）

系统 SHALL 支持对评论点赞交互（乐观更新本地态与计数）。后端评论点赞接口暂未提供，前端 SHALL 预留 `likeComment` 调用位；接口就绪前状态不持久化，就绪后无需改动 UI 即可接入。

#### Scenario: 点赞评论乐观更新

- **WHEN** 用户点击某条评论的点赞按钮
- **THEN** 系统 SHALL 立即切换该评论的点赞态与计数（本地）

#### Scenario: 后端接口就绪后接入

- **WHEN** 后端提供评论点赞接口且前端接入 `likeComment`
- **THEN** 系统 SHALL 以接口返回状态为准，失败回滚，无需改动评论 UI 结构

### Requirement: 评论递归嵌套渲染

评论回复 SHALL 采用递归渲染，支持后端返回的任意深度回复层级；为避免窄屏失控，超过视觉限深后不再增加缩进，更深回复以 `@昵称` 前缀表达引用。

#### Scenario: 渲染多层回复

- **WHEN** 后端返回的评论含多层嵌套回复
- **THEN** 系统 SHALL 递归渲染各层回复

```

Full source: openspec/changes/article-feed-and-detail/specs/post-interactions/spec.md
