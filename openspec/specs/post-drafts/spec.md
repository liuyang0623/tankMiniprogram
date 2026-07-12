# post-drafts Specification

## Purpose
TBD - created by archiving change article-publish-richtext. Update Purpose after archive.
## Requirements
### Requirement: 草稿自动保存

系统 SHALL 在用户撰写过程中自动保存草稿，避免内容丢失：首次保存调用 `POST /posts`（`status=DRAFT`）取得草稿 id，后续以节流方式调用 `PATCH /posts/:id` 更新，同一编辑会话不重复创建草稿。

#### Scenario: 首次自动保存创建草稿

- **WHEN** 用户在新建帖子时输入内容触发自动保存
- **THEN** 系统 SHALL 创建 DRAFT 帖子并记录返回的草稿 id

#### Scenario: 后续自动保存更新草稿

- **WHEN** 已存在草稿 id 且用户继续编辑触发自动保存
- **THEN** 系统 SHALL 以节流方式调用更新接口，不再重复创建草稿

#### Scenario: 节流避免频繁请求

- **WHEN** 用户连续快速输入
- **THEN** 系统 SHALL 按节流间隔合并保存请求，避免每次按键都发请求

#### Scenario: 展示保存状态

- **WHEN** 自动保存正在进行或已完成
- **THEN** 系统 SHALL 在页面角落以克制的状态字展示当前状态（如「保存中…」/「草稿已保存」），不打断用户编辑

### Requirement: 草稿箱列表

系统 SHALL 提供草稿箱，分页展示当前用户的草稿（`GET /posts/drafts`，按更新时间倒序），支持加载更多与空态。

#### Scenario: 查看草稿列表

- **WHEN** 用户进入草稿箱
- **THEN** 系统 SHALL 分页展示其草稿，按最近更新排序，支持上拉加载更多

#### Scenario: 草稿为空

- **WHEN** 用户没有任何草稿
- **THEN** 系统 SHALL 展示空态提示

### Requirement: 继续编辑草稿

系统 SHALL 允许用户从草稿箱点击草稿进入发布页继续编辑，载入草稿的标题、正文、话题。

#### Scenario: 从草稿箱继续编辑

- **WHEN** 用户点击草稿箱中某条草稿
- **THEN** 系统 SHALL 进入发布页并回填该草稿的标题、富文本正文与话题

### Requirement: 删除草稿

系统 SHALL 允许用户删除草稿，删除前二次确认，删除后从列表移除。

#### Scenario: 删除草稿

- **WHEN** 用户对某条草稿选择删除并确认
- **THEN** 系统 SHALL 调用 `DELETE /posts/:id` 删除该草稿并从列表移除

