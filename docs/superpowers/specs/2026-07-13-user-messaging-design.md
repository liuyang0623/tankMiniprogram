---
comet_change: user-messaging
role: technical-design
canonical_spec: openspec
---

# 前端私信能力 Design Doc

## 架构

```
┌────────────────────────────────────────────────────┐
│                  小程序 TabBar                      │
│  首页 │  消息 💬 │  发布 ＋ │  我的                 │
└────────────────────┬───────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────┐
│  messages/（消息 Tab 页）                            │
│  ┌─────────────────────────────────────────────┐   │
│  │ 会话列表（ConversationItem[]）               │   │
│  │ [头像] 用户A — 你好                   2     │   │
│  │ [头像] 用户B — [图片]                       │   │
│  └─────────────────────────────────────────────┘   │
└────────────────────┬───────────────────────────────┘
                     │ 点击会话 / 主页私信按钮
┌────────────────────▼───────────────────────────────┐
│  chat/（聊天页）                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 历史消息气泡（上翻分页）                      │   │
│  │   [对方] 在吗？                   白色气泡    │   │
│  │             [自己] 在的     奶橘气泡]        │   │
│  │   [对方] [图片]                              │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │ 输入框─────────────────── [+ 按钮]           │   │
│  └─────────────────────────────────────────────┘   │
└────────────────────┬───────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────┐
│ 全局 Service Layer                                   │
│  services/message.ts — REST 4接口                   │
│  store/ws.ts — WebSocket 单例 + 心跳 + 重连         │
│  store/message.ts — 会话 + 未读 + tabBar badge      │
└────────────────────────────────────────────────────┘
```

## 数据流

### 发消息（用户 → 后端）
```
用户输入文字 / 选图 → POST /messages → 后端落库
                                ↓
                         store/message.ts 更新最后消息
                                ↓
                         后端 WS push 给接收方
```

### 收消息（后端 → 用户）
```
后端 WS Hub → 用户 WS → store/ws.ts onMessage
                           ↓ type:"new_message"
                   store/message.ts onNewMessage()
                           ↓
                在聊天页中 → 追加到消息列表
                不在聊天页 → 更新会话列表 + 未读数 + tabBar badge
```

### 从个人主页进入聊天
```
他人主页私信按钮 → navigateTo chat?userId=id
                          ↓
                   聊天页 onLoad:
                   有 conversationId → 加载历史
                   有 userId → GET /users/:id 获取对方昵称（导航标题）
                              → 展示空聊天态「开始对话吧～」
                              → 用户输入第一条消息并发送
                              → POST /messages(toUserId)
                              → 返回 msg 带 conversationId, 页面存储并使用
                              → 无需改后端
```

## 数据模型（前端类型）

### types/api.ts 扩展

```typescript
interface OtherUserInfo { id: number; nickname: string; avatar: string }
interface ConversationItem { id: number; otherUser: OtherUserInfo; lastMessage: string; lastTime: string; unreadCount: number }
interface MessageItem { id: number; conversationId: number; senderId: number; type: 'text' | 'image'; content: string; createdAt: string }
interface WsMessageEnvelope { type: 'new_message'; data: MessageItem }
```

## Store 设计

### store/ws.ts — WebSocket 单例

| 方法 | 说明 |
|------|------|
| `connect()` | 登录后调用，解析 BASE_URL 拼 ws URL 带 token |
| `disconnect()` | 登出时调用，关闭 WS + 清重连定时器 |

- 挂载点：`authStore.setAuth/restore` → connect；`clear` → disconnect
- 断线重连：指数退避 1s~30s max，仅在 isLogin 时重连
- 消息分发：onMessage 解析 `WsMessageEnvelope` → `messageStore.onNewMessage`

### store/message.ts — 会话与消息

| 方法 | 说明 |
|------|------|
| `loadConversations()` | 调 GET /conversations，计算 unreadTotal，更新 tabBar badge |
| `onNewMessage(msg)` | 更新对应会话最后消息/时间/未读+1；新会话则 reload |
| `markRead(conversationId)` | 调后端 + 本地清零 unread，更新 badge |
| `reset()` | 登出时清状态 |

## 页面设计

### 消息 Tab（pages/messages/）
- 顶部：「消息」
- 列表项：对方头像 48px + 昵称（粗体）+ 最后一条消息摘要 + 时间 + 未读红点数字
- 点击 → `navigateTo chat?conversationId=`
- 下拉刷新重新加载，空态「登录后可查看消息」/「还没有消息～」
- 未登录态提示

### 聊天页（pages/chat/）
- 可接受 `?conversationId=` 或 `?userId=` 参数
- `?userId=` 进入时先调 `GET /conversations?otherUserId=`，拿到 conversationId 后继续
- 顶部导航设对方昵称
- 消息气泡：自己右对齐 `#F0A868` 白字 / 对方左对齐白底 `shadow-sm`
- 图片消息渲染缩略图（max 200px），点击 `Taro.previewImage`
- 进入时 `useEffect` 调 `markRead(conversationId)`
- 上翻：`onScrollToUpper` + `hasMore` → `loadMore`（加载旧消息时不滚动到底部，`shouldScrollBottom=false`）
- 发送成功：乐观追加到 `extraMessages` 本地列表，不刷全量
- 输入区：Taro Input（圆角灰底 `bg-gray-100 rounded-full`）+ 发送按钮（奶橘 `#F0A868`）
- `confirmType='send'` 支持键盘发送
- 图片：+ 号按钮 → Taro.chooseImage → 上传已有 `/upload/image` → 拿到 URL 发 type=image

## 后端修改

- `GET /conversations` 加可选 query 参数 `otherUserId`。传值时查当前用户与该用户的双方会话，返回 `{ id: conversationId }` 或 404（无会话时）
- **不改数据库**，纯查询，与现有 conversation 规范化排序逻辑一致

## TabBar 改造

`app.config.ts` 四 tab：
```typescript
list: [
  { pagePath: 'pages/index/index', text: '首页' },
  { pagePath: 'pages/messages/index', text: '消息' },
  { pagePath: 'pages/publish/index', text: '发布' },
  { pagePath: 'pages/profile/index', text: '我的' },
],
```

注册页面：`pages/messages/index`、`pages/chat/index`

## 边界与限制

- 图片发送：使用现有 upload 接口，先选图再上传再发
- WS 断线重连：指数退避，仅在登录态重连
- 不实现消息撤回/删除/敏感词过滤
- emoji 当普通 Unicode 文字处理
- 离线消息不推送（结束后端存储，下次进会话拉历史）
- 小程序 socket 域名需配白名单
- 个人主页私信按钮为独立 change 产物，本 change 只实现参数路由
