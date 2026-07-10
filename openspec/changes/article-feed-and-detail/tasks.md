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
