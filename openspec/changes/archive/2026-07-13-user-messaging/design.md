## Context

go-service 后端私信能力（change③ message）已就绪并合入 main：`POST /messages`、`GET /conversations`、`GET /conversations/:id/messages`、`POST /conversations/:id/read`、WebSocket `/ws?token=<jwt>`。前端现有可复用件：`request/authRequest`（受保护请求，401 清登录态）、`PageLayout`（主题容器）、`usePagedList`（泛型分页 hook）、`SkeletonList`、`useAuthStore`（登录态 + token）。本 change 纯前端，无后端改动。

现状要点：
- `useAuthStore`（`src/store/auth.ts`）已有 `setAuth/clear/restore`，是 WS 连接生命周期的天然挂载点
- `types/api.ts` 无消息相关类型；`Paginated<T>` / `PaginationMeta` 已定义可复用
- 现有 tabBar 为三 tab（首页/发布/我的），需扩为四 tab
- 小程序 `Taro.connectSocket` 只能走 query 传 token（无法自定义 header），与后端 `/ws?token=` 契约一致

## Goals / Non-Goals

**Goals:**
- 新增消息 Tab（会话列表页），底部导航扩为四 tab：首页/消息/发布/我的
- 新增聊天页 `pages/chat/?conversationId=`，展示消息历史 + 发送文字/图片消息
- 全局单例 WebSocket store（登录后连接、断线指数退避重连、消息分发）
- 全局 message store（会话列表状态、未读计数、tabBar 徽标）
- 进入聊天页自动标记已读
- 未读消息 tabBar 徽标实时更新

**Non-Goals:**
- 不改后端（契约已足）
- 不做消息撤回/删除、敏感词过滤、离线推送
- 不做群聊（仅一对一私信）
- 不做已读回执的单条粒度（仅会话级标记已读）
- emoji 当普通 Unicode 文字，无专门表情面板

## Decisions

### D1. 消息 Tab + 聊天页两个页面
- `pages/messages/index?`（tabBar 页）：会话列表，usePagedList 或直接 message store 状态
- `pages/chat/index?conversationId=<id>`（普通页）：消息气泡 + 输入区
- 都用 `PageLayout` 包裹继承主题

### D2. 全局单例 WebSocket store（store/ws.ts）
- 单例连接（模块级 `ws` 变量），登录后 `connect()`、登出 `disconnect()`
- 挂载点：`authStore.setAuth/restore` 时 connect，`clear` 时 disconnect（动态 import 避免循环依赖）
- 断线重连：指数退避 1s→2s→4s…最大 30s，仅在仍登录时重连
- 消息分发：`onMessage` 解析 `{type:"new_message", data}` → 调 `messageStore.onNewMessage`
- WS 地址：BASE_URL 的 http(s)→ws(s)，去掉 `/api/v1` 后缀拼 `/ws?token=`

### D3. 全局 message store（store/message.ts）
- `conversations` / `unreadTotal` / `loadConversations()`
- `onNewMessage(msg)`：更新对应会话最后消息/时间/未读+1，移到列表头；新会话则整体 reload
- `markRead(conversationId)`：调后端 + 本地未读清零
- tabBar 徽标：`unreadTotal` 变化时 `Taro.setTabBarBadge(index:1)`

### D4. 聊天页交互
- 消息倒序渲染（最旧在上），进入滚动到底部，上翻加载历史
- 气泡样式：自己右对齐奶橘 `#F0A868` 白字，对方左对齐白底
- 图片消息渲染缩略图，点击 `Taro.previewImage`
- 输入区：Taro `Input` + 发送按钮
- 图片发送：复用既有 upload 接口拿 URL → 发 type=image
- 进入页面 `markRead` 标记已读

### D5. TabBar 四 tab
- `app.config.ts`：首页/消息/发布/我的，注册 `pages/messages/index`、`pages/chat/index`

## Risks / Open Questions

- 小程序 WS 域名需在微信后台配 socket 合法域名（dev 用本地开发工具跳过校验）
- WS 重连风暴：断线退避 + 仅登录态重连已缓解
- 图片上传接口复用性待 build 时确认（既有 `services` 是否已有 upload 封装）
