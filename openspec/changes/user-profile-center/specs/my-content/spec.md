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
