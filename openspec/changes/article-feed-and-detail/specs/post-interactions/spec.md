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
