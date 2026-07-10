# wechat-auth Specification

## Purpose
TBD - created by archiving change miniprogram-foundation. Update Purpose after archive.
## Requirements
### Requirement: 微信登录换取 JWT

系统 SHALL 通过 `wx.login` 获取临时 code，调用 `POST /api/v1/auth/wechat/login` 换取 JWT 与用户信息，用于后续受保护接口鉴权。

#### Scenario: 首次登录成功

- **WHEN** 用户触发登录且 `wx.login` 返回有效 code
- **THEN** 系统 SHALL 调用登录接口换取 JWT，并将用户信息写入全局登录态

#### Scenario: 登录接口失败

- **WHEN** 登录接口返回错误或网络失败
- **THEN** 系统 SHALL 提示登录失败且不写入无效登录态

### Requirement: 登录态持久化

系统 SHALL 将 JWT 与基本用户信息持久化到本地存储，小程序重启后 SHALL 自动恢复登录态而无需重新登录（token 未失效时）。

#### Scenario: 重启恢复登录态

- **WHEN** 已登录用户关闭并重新打开小程序，且本地 token 未失效
- **THEN** 系统 SHALL 从本地存储恢复登录态，用户处于已登录状态

### Requirement: 登录态守卫与未登录浏览兜底

系统 SHALL 区分公开与受保护操作：公开内容（如帖子列表、详情）允许未登录浏览；受保护操作（发布、点赞、收藏、评论、个人中心）在未登录时 SHALL 引导用户登录。

#### Scenario: 未登录浏览公开内容

- **WHEN** 未登录用户访问帖子列表或详情
- **THEN** 系统 SHALL 正常展示内容，不强制登录

#### Scenario: 未登录触发受保护操作

- **WHEN** 未登录用户尝试发布/点赞/收藏/评论或进入个人中心
- **THEN** 系统 SHALL 引导用户先完成登录再继续该操作

