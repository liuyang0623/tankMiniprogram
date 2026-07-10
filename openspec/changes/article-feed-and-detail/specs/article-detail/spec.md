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
