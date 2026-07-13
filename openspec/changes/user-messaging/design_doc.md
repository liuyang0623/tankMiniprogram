# Design Doc — 前端私信能力（user-messaging）

## 1. 架构概述

```
┌─────────────────────────────────────────────────────┐
│                   小程序 TabBar                       │
│  首页 🏠  │  消息 💬  │  发布 ＋  │  我的 👤         │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  消息 Tab（pages/messages/）                          │
│  ┌─────────────────────────────────────────────┐    │
│  │ 会话列表（ConversationItem[]）                │    │
│  │ [头像] 用户A — "你好"                2条未读   │    │
│  │ [头像] 用户B — "图片"                         │    │
│  └─────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────┘
                       │ 点击
┌──────────────────────▼──────────────────────────────┐
│  聊天页（pages/chat/?conversationId=）               │
│  ┌─────────────────────────────────────────────┐    │
│  │ 消息气泡（上翻分页历史）                       │    │
│  │  你: 你好  ✓                                │    │
│  │  对方: 在呢                               │    │
│  │  你: [图片]  ✓                             │    │
│  └─────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────┐    │
│  │ [＋] ┌─────────────────────────┐ [发送]     │    │
│  │      │    输入文字…            │            │    │
│  │      └─────────────────────────┘            │    │
│  └─────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              全局 Service Layer                       │
│  services/message.ts → POST /messages (REST)         │
│                                     ← WS /ws?token=  │
│  store/ws.ts ─── WebSocket 单例连接管理              │
│  store/message.ts ─── 会话/未读全局状态               │
└─────────────────────────────────────────────────────┘
```

## 2. 数据流

### 2.1 发消息（用户 → 后端）
```
[输入框] → POST /messages → 后端落库
                          ↓
                    store/message.ts 追加到会话最后消息
                          ↓
                    WS 推送给接收方（后端 Hub 处理）
```

### 2.2 收消息（后端 → 用户）
```
后端 WS Hub → 用户 WS 连接 → store/ws.ts onMessage
                                        ↓
                            判断消息类型 type: "new_message"
                                        ↓
                            store/message.ts 更新会话最后消息+未读数
                                        ↓
                            如果在聊天页 → 聊天页追加消息
                            如果不在聊天页 → tabBar 徽标增加
```

### 2.3 已读流程
```
用户进入聊天页 → POST /conversations/:id/read
                       ↓
                后端标记已读 + 重置未读数
                       ↓
                前端 store/message.ts 重置未读数
                       ↓
                tabBar 徽标更新
```

## 3. Store 设计

### store/ws.ts — WebSocket 单例连接管理

```typescript
interface WsState {
  connected: boolean
  /** 启动 WS 连接（登录后调用） */
  connect: () => void
  /** 断开连接（登出时调用） */
  disconnect: () => void
}

// 单例模式：登录后调用 connect() 建立连接
// 监听 onMessage：分发 type 到对应 handler
// 断线重连：指数退避（1s/2s/4s/8s… 最大 30s）
// 心跳：后端每 54s ping，浏览器/小程序自动 pong
```

### store/message.ts — 会话与消息状态

```typescript
interface MessageState {
  conversations: ConversationItem[]
  unreadTotal: number
  /** 加载会话列表 */
  loadConversations: () => Promise<void>
  /** 添加新消息到对应的会话（WS 推送回调） */
  onNewMessage: (msg: MessageItem) => void
  /** 标记已读并更新本地未读数 */
  markRead: (conversationId: number) => void
}
```

## 4. 页面设计

### 消息 Tab（pages/messages/）

- 顶部导航标题：「消息」
- 列表项：头像 + 昵称 + 最后一条消息摘要 + 时间 + 未读红点
- 点击 → 跳转聊天页
- 下滑刷新拉取会话列表
- 空态：无消息时的占位图 + 文案「还没有消息～」

### 聊天页（pages/chat/?conversationId=）

- 顶部导航：对方昵称（Taro.setNavigationBarTitle）
- 消息气泡：
  - 自己发的：右对齐，奶橘色 `#F0A868`
  - 对方发的：左对齐，白色
  - 图片消息：渲染图片，可预览
- 消息列表倒序：最旧在上，最新在底部；进入时滚动到底部
- 上拉（往上滚动）加载历史消息（分页）
- 底部输入区：文字输入框 + 图片按钮（暂停使用上传接口拿 URL 后发 type=image）+ 发送按钮
- 进入页面时 POST /conversations/:id/read 标记已读 + 重置本地未读数
- 接收 WS 推送新消息时追加到列表底部

## 5. TabBar 方案

四 tab：首页 / 消息 / 发布 / 我的

```typescript
list: [
  { pagePath: 'pages/index/index', text: '首页' },
  { pagePath: 'pages/messages/index', text: '消息' },
  { pagePath: 'pages/publish/index', text: '发布' },
  { pagePath: 'pages/profile/index', text: '我的' },
],
```

未读计数：tabBar 徽标用 `Taro.setTabBarBadge`（微信原生支持）。
- 在 `store/message.ts` 的 `unreadTotal` 变化时调用
- 登录时加载未读数
- 收到新消息时增加
- 标记已读时减少

## 6. 边界与限制

- **图片发送**：先复用既有 upload 接口拿 URL，再发 type=image 消息。chat 页增加图片选择器。
- **WebSocket 地址**：`ws://localhost:3000/ws?token=`（dev），prod 切换为 `wss://`。
- **小程序 WS 限制**：`wx.connectSocket` 最多同时 5 个连接，我们只用 1 个。域名需配白名单。
- **消息撤回/删除**：本 change 不做。
- **敏感词过滤**：本 change 不做（后端也未做）。
- **离线消息**：不推送（后端已存储，下次打开会话加载历史）。
- **emoji**：当做普通文字，无需特殊处理。
