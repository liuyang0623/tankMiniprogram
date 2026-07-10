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
