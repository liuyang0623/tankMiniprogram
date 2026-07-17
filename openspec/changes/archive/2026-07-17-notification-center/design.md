## Context

现有 `internal/message` 是双人私信结构（Conversation 强制 UserAID<UserBID 配对 + Message），承载不了"系统→用户"的单向通知。需新建独立 notification 子系统。关注触发点已定位在 `internal/follow/service.go` 的 `ToggleFollow`——`Create(&Follow{...})` 成功后（返回 true）即"新增关注"时刻。前端消息页当前只有私信列表，无系统通知入口。

本 change（A）只做站内通知；微信订阅消息推送是后续 Change B。

## Goals / Non-Goals

**Goals:**
- 后端可存储、查询、标记已读系统通知，类型可扩展（`follow` 先落地）。
- 关注成功后可靠写入通知，且不拖累关注主流程。
- 前端消息页顶部固定"系统通知"聚合入口 + 独立详情页 + 整体已读 + 关注者可点跳主页。

**Non-Goals:**
- 微信订阅消息推送（Change B）。
- 点赞/评论通知的实际实现（仅预留类型结构）。
- 逐条已读、通知偏好设置、通知删除。

## Decisions

### 1. 独立 notification 模块，不复用 message
新建 `internal/notification/`（model/service/handler），与 message 平级。通知是单向、无会话概念，复用私信会话模型会引入"系统用户"等别扭抽象。表 `notifications`：
```
id, user_id(接收者,index), type(varchar 20), actor_id(触发者), target_id(可空,预留帖子等),
read(bool default false), created_at, (软删继承 gorm.Model)
索引：(user_id, read) 加速未读计数；(user_id, created_at) 加速倒序列表
```
**备选**：给 message 加 type=system——弃，污染私信语义、查询混乱。

### 2. 关注触发：同步写入 + 错误隔离
在 `ToggleFollow` 成功创建关注后，紧随调用 `notificationSvc.CreateFollow(ctx, targetID, followerID)`。写入与关注**不强制同一事务**——通知失败只记日志，`ToggleFollow` 仍返回 true。理由：关注是核心操作必须成功；通知是附属，丢一条可接受，不能因通知报错回滚关注。
- 依赖注入：follow service 持有 notification service 引用（构造函数传入），避免包循环（notification 不反向依赖 follow）。
- **备选**：goroutine 异步写——本地 DB 写入极快，同步足够；异步反而使测试和错误处理复杂化。留给 Change B 的微信推送用异步（那才是慢 I/O）。

### 3. 聚合入口数据：unread-count 接口返回"未读数 + 最新摘要"
消息页顶部固定项需要两项数据：未读红点数、最新一条摘要。合并成一个轻接口 `GET /notifications/unread-count` 返回 `{ unreadCount, latest: { type, actorNickname, summary, createdAt } }`，避免消息页额外拉全量列表。详情页才拉 `GET /notifications` 分页全量。

### 4. 前端：新增 notification store + 独立详情页
- 新增 `store/notification.ts`（未读数 + 最新摘要 + 列表），不并入 message store——职责清晰，message store 已管会话足够重。
- 消息页顶部渲染固定入口（读 notification store 的 unreadCount/latest），`useDidShow` 时刷新 unread-count。
- 新增页面 `pages/notifications/`（详情），进入时拉列表 + 调 markRead，返回消息页后入口红点清零。
- 关注者昵称/头像点击 → `Taro.navigateTo` 到 `pages/user-profile?userId=actorId`（复用现有他人主页）。

### 5. 摘要文案后端生成还是前端拼
后端返回结构化字段（type + actorNickname），**前端按 type 拼文案**（"XX 关注了你"）。理由：文案是展示层，前端拼便于国际化/改文案，后端只给数据。

## Risks / Trade-offs

- [通知写入失败静默丢失] → 记录 error 日志便于排查；通知非关键数据，可接受最终不一致。
- [关注高频时通知表增长] → 本期不做清理；索引已覆盖查询路径。未来可加 TTL 或归档（Change 之外）。
- [follow → notification 包依赖] → 单向依赖（follow 依赖 notification），构造注入，无循环；notification 不感知 follow。
- [前端入口与详情已读时序] → 详情页进入即 markRead，返回消息页 `useDidShow` 重拉 unread-count 保证红点同步；若接口失败红点不清，下次进入重试。

## Migration Plan

- 新增 `notifications` 表：随后端启动 AutoMigrate（项目现有 migration 机制）建表，纯新增无数据迁移。
- 回滚：删除 notification 路由/模块 + drop 表；follow service 去掉通知调用即恢复原行为。

## Open Questions

- 无阻塞性问题。（点赞/评论通知的具体文案与触发点留待各自 change；本期结构已预留 type/target_id。）
