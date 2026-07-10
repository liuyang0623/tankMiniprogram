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
