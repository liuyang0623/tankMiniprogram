# Implementation Tasks — user-messaging（前端私信能力）

## 1. 类型扩展

- [x] 1.1 `types/api.ts`：新增 `ConversationItem`（id/otherUser(id/nickname/avatar)/lastMessage/lastTime/unreadCount）、`MessageItem`（id/conversationId/senderId/type/content/createdAt）、`PaginatedConversations` / `PaginatedMessages`

## 2. 消息 API 服务

- [x] 2.1 `services/message.ts`：`sendMessage(toUserId, type?, content)` → POST /messages
- [x] 2.2 `getConversations(page, limit)` → GET /conversations
- [x] 2.3 `getMessages(conversationId, page, limit)` → GET /conversations/:id/messages
- [x] 2.4 `markRead(conversationId)` → POST /conversations/:id/read

## 3. WebSocket 全局 Store

- [x] 3.1 `store/ws.ts`：单例 WS 连接管理（connect/disconnect）
- [x] 3.2 登录后自动 connect（authStore setAuth 时触发，clear 时 disconnect）
- [x] 3.3 断线重连：指数退避（1s/2s/4s/8s…30s max）
- [x] 3.4 消息分发：收到 "new_message" 类型 → 调 messageStore.onNewMessage
- [x] 3.5 暴露 `connected` 状态（boolean）

## 4. 消息 Store

- [x] 4.1 `store/message.ts`：`conversations` / `unreadTotal` / `loadConversations()`
- [x] 4.2 `onNewMessage(msg)`：更新对应会话的最后消息/时间/未读数，追加到列表头部
- [x] 4.3 `markRead(conversationId)`：减少 unreadTotal，重置该会话 unreadCount
- [x] 4.4 TabBar badge：`useEffect` 监听 unreadTotal 变化，调用 `Taro.setTabBarBadge`

## 5. 消息 Tab 页

- [x] 5.1 `pages/messages/index.config.ts`：导航标题 "消息"
- [x] 5.2 `pages/messages/index.tsx`：使用 usePagedList 加载会话列表，PageLayout 包裹
- [x] 5.3 列表项：头像+昵称+最后消息摘要+时间+未读红点；点击跳转 chat?conversationId=
- [x] 5.4 空态：占位+文案「还没有消息～」
- [x] 5.5 下拉刷新：useDidShow + reload

## 6. 聊天页

- [x] 6.1 `pages/chat/index.config.ts`：导航标题默认"聊天"
- [x] 6.2 `pages/chat/index.tsx`：读 `?conversationId=`，usePagedList 加载消息
- [x] 6.3 消息气泡：自己发的（右/奶橘底）、对方发的（左/白底），图片可预览
- [x] 6.4 进入时滚动到底部，上翻加载历史
- [x] 6.5 输入区：Taro Input + 发送按钮 → sendMessage 追加到列表
- [x] 6.6 图片按钮：选择相册 → 上传 → 发送
- [x] 6.7 进入时调用 markRead 标记已读
- [x] 6.8 WS 新消息：如果在当前会话则追加

## 7. 注册到 app.config.ts

- [x] 7.1 注册 `pages/messages/index`、`pages/chat/index` 到 pages 数组
- [x] 7.2 TabBar 改为四 tab：首页/消息/发布/我的

## 8. 验证

- [x] 8.1 tsc 类型检查通过
- [x] 8.2 weapp 编译通过
