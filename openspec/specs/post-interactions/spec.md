# post-interactions Specification

## Purpose
TBD - created by archiving change article-feed-and-detail. Update Purpose after archive.
## Requirements
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

#### Scenario: 限深后不再缩进

- **WHEN** 回复层级超过视觉限深
- **THEN** 系统 SHALL 停止增加缩进，以 `@昵称` 前缀表达引用关系，保证窄屏可读

