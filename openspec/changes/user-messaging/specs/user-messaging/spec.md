# message Specification

## Purpose
提供前端私信 UI，支撑用户之间的私密交流。含消息 Tab、会话列表、聊天页面、WebSocket 实时收消息。

## ADDED Requirements

### Requirement: 消息 Tab

系统 SHALL 在底部 TabBar 中提供「消息」tab，显示会话列表，并在全局展示未读消息总数。

#### Scenario: 消息 Tab 入口

- **WHEN** 用户点击底部「消息」tab
- **THEN** 系统 SHALL 展示用户的所有会话列表，顶部导航显示「消息」

#### Scenario: 未读计数

- **WHEN** 用户有未读消息时
- **THEN** 系统 SHALL 在 TabBar「消息」图标右上角显示未读总数徽标

#### Scenario: 未读计数更新

- **WHEN** 用户在聊天页标记已读或收到新消息
- **THEN** 系统 SHALL 实时更新 TabBar 未读徽标

### Requirement: 会话列表

系统 SHALL 在消息 Tab 展示用户的会话列表，每项含对方用户信息、最后一条消息、最后时间、未读标记。

#### Scenario: 查看会话列表

- **WHEN** 用户进入消息 Tab
- **THEN** 系统 SHALL 分页加载并展示会话列表（对方头像/昵称/最后消息/时间/未读红点）

#### Scenario: 空态

- **WHEN** 用户从未收发过消息
- **THEN** 系统 SHALL 展示空态占位与文案「还没有消息～」

#### Scenario: 点击进入聊天

- **WHEN** 用户点击某会话项
- **THEN** 系统 SHALL 跳转至聊天页，传递会话 ID

#### Scenario: 刷新会话列表

- **WHEN** 用户下拉消息 Tab
- **THEN** 系统 SHALL 重新加载会话列表

### Requirement: 聊天页

系统 SHALL 提供聊天页 `pages/chat/?conversationId=`，展示消息历史，支持发送文字/图片消息。

#### Scenario: 查看历史消息

- **WHEN** 用户进入聊天页
- **THEN** 系统 SHALL 分页加载消息历史，最旧在上、最新在下，自动滚动到底部

#### Scenario: 上翻加载更多

- **WHEN** 用户向上滚动到消息列表顶部
- **THEN** 系统 SHALL 加载更早的历史消息并追加

#### Scenario: 发送文字消息

- **WHEN** 用户在输入框输入文字并点击发送
- **THEN** 系统 SHALL 调用 POST /messages 发送，成功后追加到消息列表底部

#### Scenario: 发送图片消息

- **WHEN** 用户点击图片按钮选择图片
- **THEN** 系统 SHALL 先调用上传接口获取 URL，再发送 type=image 消息

#### Scenario: 实时接收新消息

- **WHEN** 用户在聊天页时收到 WebSocket 推送的新消息
- **THEN** 系统 SHALL 将新消息追加到列表底部

#### Scenario: 接收不在当前会话的新消息

- **WHEN** 用户不在聊天页时收到新消息
- **THEN** 系统 SHALL 更新会话列表最后消息和未读数，但不打扰用户当前浏览

### Requirement: WebSocket 连接管理

系统 SHALL 提供全局 WebSocket 单例，管理连接生命周期与断线重连。

#### Scenario: 启动连接

- **WHEN** 用户登录成功
- **THEN** 系统 SHALL 建立 WebSocket 连接（/ws?token=）

#### Scenario: 断开连接

- **WHEN** 用户登出或 token 失效
- **THEN** 系统 SHALL 主动关闭 WebSocket 连接

#### Scenario: 断线重连

- **WHEN** WebSocket 连接意外断开
- **THEN** 系统 SHALL 以指数退避（1s~30s）自动重连

#### Scenario: 消息分发

- **WHEN** WebSocket 收到 "new_message" 类型消息
- **THEN** 系统 SHALL 解析并分发到 message store 更新会话列表和未读数

### Requirement: 标记已读

系统 SHALL 在进入聊天页时自动标记会话已读。

#### Scenario: 进入聊天页标记已读

- **WHEN** 用户进入聊天页
- **THEN** 系统 SHALL 调用 POST /conversations/:id/read 标记已读并更新本地未读数
