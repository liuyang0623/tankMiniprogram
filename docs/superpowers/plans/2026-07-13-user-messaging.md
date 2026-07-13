---
change: user-messaging
design-doc: docs/superpowers/specs/2026-07-13-user-messaging-design.md
base-ref: 80d32ba46654bc8ca776e0468103cae25edcca1a
---

# 实施计划 — 前端私信能力（user-messaging）

参见设计文档：`docs/superpowers/specs/2026-07-13-user-messaging-design.md`

## 任务 1：类型扩展

**文件**：`src/types/api.ts`

- [x] 新增 `OtherUserInfo`（id/nickname/avatar）
- [x] 新增 `ConversationItem`（id/otherUser/lastMessage/lastTime/unreadCount）
- [x] 新增 `MessageItem`（id/conversationId/senderId/type/content/createdAt）
- [x] 新增 `PaginatedConversations` / `PaginatedMessages` / `WsMessageEnvelope`

**验收**：tsc 通过，类型可被 store/page 引用

## 任务 2：消息 API 服务

**文件**：`src/services/message.ts`

- [x] `sendMessage(toUserId, content, type)` → POST /messages
- [x] `getConversations(page, limit)` → GET /conversations
- [x] `getMessages(conversationId, page, limit)` → GET /conversations/:id/messages
- [x] `markRead(conversationId)` → POST /conversations/:id/read

**验收**：复用 authRequest（自动注入 token），tsc 通过

## 任务 3：WebSocket 全局 Store

**文件**：`src/store/ws.ts`

- [x] 单例连接（模块级 ws 变量），`connect()` / `disconnect()`
- [x] `Taro.connectSocket` 返回 Promise，await 拿 SocketTask（关键：非同步）
- [x] 断线重连指数退避 1s~30s，仅登录态重连
- [x] onMessage 解析 `new_message` → messageStore.onNewMessage
- [x] BASE_URL http(s)→ws(s)，去 /api/v1 拼 /ws?token=

**验收**：tsc 通过，登录/登出触发连接/断开

## 任务 4：消息 Store

**文件**：`src/store/message.ts`

- [x] `conversations` / `unreadTotal` / `lastIncoming` / `loadConversations()`
- [x] `onNewMessage(msg)`：更新会话最后消息/未读+1/移到头部；记录 lastIncoming
- [x] `markRead(conversationId)`：后端 + 本地清零
- [x] tabBar badge：unreadTotal 变化调 `Taro.setTabBarBadge(index:1)`
- [x] `reset()` 登出清状态

**验收**：tsc 通过

## 任务 5：消息 Tab 页

**文件**：`src/pages/messages/index.tsx` + `index.config.ts`

- [x] 导航标题「消息」
- [x] 会话列表：头像+昵称+摘要+时间+未读红点
- [x] 点击跳转 chat?conversationId=
- [x] 空态 / 未登录态
- [x] useDidShow 刷新 + 下拉刷新

**验收**：weapp 编译产物含 pages/messages

## 任务 6：聊天页

**文件**：`src/pages/chat/index.tsx` + `index.config.ts`

- [x] 双入口参数：`?conversationId=`（会话列表）/ `?userId=`（他人主页）
- [x] userId 进入：getUser 设导航标题，空态等首条消息，POST 后拿 conversationId
- [x] 消息气泡：自己奶橘#F0A868右对齐 / 对方白底左对齐；图片 previewImage
- [x] 进入滚动到底部，上翻加载历史
- [x] 输入区：Taro Input + 加号按钮（选图→upload→发 type=image）
- [x] 进入 markRead；WS 新消息订阅 lastIncoming 追加

**验收**：weapp 编译产物含 pages/chat

## 任务 7：TabBar + 页面注册

**文件**：`src/app.config.ts`

- [x] pages 注册 pages/messages/index、pages/chat/index
- [x] tabBar 四 tab：首页/消息/发布/我的

**验收**：app.json tabBar 四项

## 任务 8：入口接入

**文件**：`src/pages/user-profile/index.tsx`

- [x] 激活私信按钮：从 showToast 占位改为 navigateTo chat?userId=

**验收**：他人主页私信按钮可进聊天页

## 任务 9：验证

- [x] tsc 类型检查通过（零错误）
- [x] weapp 编译通过（10 页产物完整，tabBar 四项）

> 真机冒烟（verify 阶段执行）：消息 Tab、会话列表、发送文字/图片、从主页进聊天、WS 实时收消息、未读徽标
