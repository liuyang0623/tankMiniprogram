# article-feed Specification

## Purpose
TBD - created by archiving change article-feed-and-detail. Update Purpose after archive.
## Requirements
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

