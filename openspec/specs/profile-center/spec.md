# profile-center Specification

## Purpose
TBD - created by archiving change user-profile-center. Update Purpose after archive.
## Requirements
### Requirement: 个人中心资料展示

系统 SHALL 在个人中心页展示当前登录用户的资料（头像、昵称、简介）；未登录时展示登录入口，点击触发微信登录。

#### Scenario: 已登录展示资料

- **WHEN** 已登录用户进入个人中心
- **THEN** 系统 SHALL 展示其头像、昵称、简介，以及编辑入口与「我的帖子/我的收藏」入口

#### Scenario: 未登录展示登录入口

- **WHEN** 未登录用户进入个人中心
- **THEN** 系统 SHALL 展示登录入口，点击后走微信登录，成功后展示资料

### Requirement: 我的帖子与我的收藏（Tab 切换）

系统 SHALL 在个人中心以 Tab 切换展示「我的帖子」（`GET /posts/my`）与「我的收藏」（`GET /users/me/favorites`），均分页加载，点击项进入详情。

#### Scenario: 切换查看我的帖子

- **WHEN** 用户切到「我的帖子」Tab
- **THEN** 系统 SHALL 分页展示其已发布帖子，支持加载更多，点击进详情

#### Scenario: 切换查看我的收藏

- **WHEN** 用户切到「我的收藏」Tab
- **THEN** 系统 SHALL 分页展示其收藏的帖子，点击进详情

#### Scenario: 空态

- **WHEN** 我的帖子或收藏为空
- **THEN** 系统 SHALL 展示相应空态提示

