## Why

go-service 后端私信能力（change③）已上线：会话持久化、REST 收发、WebSocket 实时推送。用户现在可以通过后端发消息了，但还没有前端 UI。本 change 交付前端消息模块：消息 tab、会话列表、聊天页面，并接入 WebSocket 实时收消息。

用户已确认：
- TabBar：改为四 tab（首页/消息/发布/我的），发布入口保留
- WebSocket：全局单例 store，登录后启动，管理心跳/断线重连/消息分发
- 输入框：Taro Input

## What Changes

- **新增页面**：`pages/messages/`（会话列表页，tabBar）、`pages/chat/`（聊天页，?conversationId=）
- **TabBar 重构**：四 tab（首页/消息/发布/我的），发布入口保留
- **store**：`store/ws.ts`（WebSocket 单例连接管理 + 消息分发）、`store/message.ts`（会话列表状态 + 未读计数）
- **services**：`services/message.ts`（对接 go-service 5 个 REST 接口）
- **types**：`types/api.ts` 扩展 ConversationItem/MessageItem 类型
- **app.config.ts**：注册 `pages/messages/index`、`pages/chat/index`

## Capabilities

### New Capabilities
- `user-messaging`: 前端私信能力——消息 Tab 入口、会话列表、聊天页、WebSocket 实时收消息（文字/图片）、未读计数

### Modified Capabilities
<!-- 无既有 spec 变更 -->

## Impact

- **新增文件**：
  - `src/pages/messages/index.tsx` + `index.config.ts`
  - `src/pages/chat/index.tsx` + `index.config.ts`
  - `src/store/ws.ts`
  - `src/store/message.ts`
  - `src/services/message.ts`
- **修改**：
  - `src/app.config.ts`：四 tab + 注册页面
  - `src/types/api.ts`：扩展类型
- **图片消息**：content 存图片 URL（复用既有 upload 接口上传拿 URL），chat 页渲染图片
- **未读计数**：会话列表红点 / 数字标记；tabBar badge 在低版本微信上用自定义组件
- **前端只发 REST，不收 WS**：go-service 的 WS 是单向推送，客户端也通过 REST 发消息
