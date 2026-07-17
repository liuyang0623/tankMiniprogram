# notification-center 实施任务

## 1. 后端 notification 模块

- [x] 1.1 新建 `internal/notification/model.go`：`Notification{ gorm.Model, UserID, Type, ActorID, TargetID*, Read }` + 表名 + 索引 `(user_id,read)`、`(user_id,created_at)`；响应 DTO（含 actor 昵称/头像/id）
- [x] 1.2 新建 `internal/notification/service.go`：`CreateFollow(ctx, userID, actorID)`、`List(ctx, userID, page, limit)`（倒序、join 触发者信息）、`MarkAllRead(ctx, userID)`、`UnreadSummary(ctx, userID)`（未读数 + 最新一条摘要字段）
- [x] 1.3 新建 `internal/notification/handler.go` + 路由注册：`GET /api/v1/notifications`、`POST /api/v1/notifications/read`、`GET /api/v1/notifications/unread-count`（均挂 JWT 中间件）
- [x] 1.4 表建立：将 `Notification` 加入现有 AutoMigrate 列表
- [x] 1.5 单测：service CRUD（创建/列表倒序/整体已读/未读摘要）、handler 鉴权与本人隔离

## 2. 关注触发通知

- [x] 2.1 `internal/follow/service.go`：FollowService 构造注入 notification service 引用（单向依赖，避免包循环）
- [x] 2.2 `ToggleFollow` 成功创建关注后调用 `CreateFollow`；写入失败仅记日志、不影响关注返回
- [x] 2.3 单测：关注成功写通知、取关不写、通知写入失败关注仍返回成功、不能关注自己

## 3. 后端验证

- [x] 3.1 `go build ./...` 通过
- [x] 3.2 `go test ./...` 全绿（含 notification + follow 触发）

## 4. 前端 API 与 store

- [x] 4.1 `src/services/api/notification.ts`：`list(page)`、`markRead()`、`unreadCount()`（走 `authRequest`）
- [x] 4.2 `src/types/` 补通知类型（Notification / UnreadSummary）
- [x] 4.3 `src/store/notification.ts`：未读数 + 最新摘要 + 列表；`refreshUnread()`、`loadList()`、`markRead()`

## 5. 前端聚合入口与详情页

- [x] 5.1 `src/pages/messages/index.tsx`：顶部固定"系统通知"聚合项（常驻，读 store 的 unreadCount/latest，含红点），`useDidShow` 刷新未读；点击跳详情页
- [x] 5.2 系统通知列表项组件：按 type 渲染文案（`follow` → "XX 关注了你"），关注类昵称/头像可点
- [x] 5.3 新增 `src/pages/notifications/`（详情页 + config）：倒序列表、进入即 `markRead`、关注者昵称/头像点击 `navigateTo` 到 user-profile
- [x] 5.4 注册页面到 `src/app.config.ts`

## 6. 前端验证

- [x] 6.1 `npx tsc --noEmit` 0 错
- [x] 6.2 `npx vitest run` 全绿（补 notification store/api 关键单测）
- [x] 6.3 `npm run build:weapp` EXIT 0

## 7. 端到端与收尾

- [x] 7.1 端到端（真机/开发者工具）：b 关注 a → a 消息页系统通知红点 +1、摘要更新 → 点进详情看到"b 关注了你" → 点昵称跳 b 主页 → 返回红点清零
- [x] 7.2 按 AGENT.md 文档同步铁律更新 README（功能模块加系统通知）
