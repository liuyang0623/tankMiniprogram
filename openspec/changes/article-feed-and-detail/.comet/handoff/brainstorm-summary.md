# Brainstorm Summary

- Change: article-feed-and-detail
- Date: 2026-07-10

## 确认的技术方案

**核心抽象**
- `usePagedList<T>(fetchPage)` hook（用户确认方向 A）：封装 `{list,page,hasMore,loading,refreshing,error,loadMore,refresh,reload}`，首页/评论/后续列表复用，可注入 mock 单测。放 `src/hooks/usePagedList.ts`
- 乐观更新模式：点赞/收藏/评论点赞共用「乐观改 + 失败回滚 + Toast」，未登录经 useAuthGuard

**页面/组件**
- pages/index（信息流，usePagedList + PostCard + 下拉刷新/触底加载）
- pages/detail（详情：文章头 + rich-text 正文 + 图片预览 + InteractionBar + CommentList）
- components: PostCard / InteractionBar / CommentList / CommentItem（递归） / CommentInput
- 复用地基 Card/Avatar/Tag/Skeleton/Button/Toast

**用户确认的交互决策**
- 详情用独立页（Taro.navigateTo）
- 点赞/收藏乐观更新 + 失败回滚
- 评论展示两层（基础），但 CommentItem 递归支持任意深度

**新增需求（用户在 design 阶段提出，超出原 3 份 delta spec）**
- 富文本图片预览：解析 content 的 `<img>`，点击 `Taro.previewImage` 全屏预览（纯前端）
- 评论点赞：前端完整 UI+交互+本地态，预留 `interactions.likeComment(id)` 接口（后端暂无，状态不持久化）
- 评论无限层级嵌套：CommentItem 递归渲染任意深度（视觉限深防失控），后端目前只返一层就显两层，后端加深自动生效

**rich-text**：详情正文用 rich-text 渲染 content HTML，基础样式兜底

## 关键取舍与风险

- 评论点赞/无限嵌套受后端限制（无评论点赞接口、replies 只返一层）：前端先做 UI+本地态并预留，后端补齐后放开
- rich-text 不支持子节点事件 → 图片预览需解析 img 单独处理
- rich-text 标签支持有限 → 基础样式兜底，复杂回显后置到 publish change
- 乐观更新一致性 → 以接口 toggle 返回值覆盖本地态，失败回滚
- 服务端未起 → 复用地基已验证请求层错误处理 + 兜底 UI

## 测试策略

- 单元（vitest）：usePagedList（加载/加载更多/刷新/到底/错误）、乐观更新回滚逻辑
- tsc 类型校验 + weapp 编译
- 开发者工具冒烟：信息流滚动/刷新、进详情、rich-text、图片预览、点赞收藏、评论回复/评论点赞（服务端未起时验证兜底 UI 与交互逻辑）

## 非目标（YAGNI）

不引 SWR/react-query；不做评论排序/热度；不做 @提及自动补全。

## Spec Patch（将回写 delta spec）

- `article-detail` spec 补「富文本图片预览」需求与场景
- `post-interactions` spec 补「评论点赞（前端+预留接口）」「评论递归嵌套渲染」需求与场景
