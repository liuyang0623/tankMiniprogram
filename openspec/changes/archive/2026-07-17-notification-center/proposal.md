## Why

用户被关注时目前只能在 App 内被动查看，缺少一个集中的"谁与我互动"的通知入口，离开小程序即无感知。现有 `message` 模块是双人私信结构，无法承载"关注/点赞"这类系统→用户的单向通知。需要新建独立的通知中心，先覆盖"有人关注我"场景，并为后续点赞、评论等互动通知打好地基。

本 change 是"关注通知"特性拆分的 **Change A（站内通知层，零微信依赖）**；后续 Change B 再做微信订阅消息推送作为增强。

## What Changes

- 新增**站内系统通知**：后端 notification 模块（模型 / service / handler / 路由 / migration），存储"接收者 + 类型 + 触发者 + 已读态"。类型可扩展（`follow` 先落地，预留 `like`/`comment`）。
- **关注时写通知**：用户 b 关注用户 a 时，为 a 写一条 `follow` 类型系统通知；写入失败不影响关注主流程。
- **聚合式入口**：消息列表**顶部固定一条"系统通知"聚合项**（不随私信会话排序沉下，即使无新消息也常驻），副标题显示最新一条摘要（如"XX 关注了你"），带未读红点（未读总数）。
- **系统通知详情页**：点击聚合项进入独立页，按时间倒序展示全部系统通知（关注/以后的点赞/评论混合）。关注类通知的**用户名/头像可点击 → 跳转对方主页**。
- **已读粒度**：进入详情页时整体标记已读，入口红点清零（不做逐条已读）。

## Capabilities

### New Capabilities
- `notification-center`: 站内系统通知的存储、写入、列表/整体已读/未读计数能力，关注事件触发通知的集成，以及消息页聚合入口 + 系统通知详情页展示。

### Modified Capabilities
<!-- 关注行为本身的对外契约不变（仍是 toggle 关注），仅在成功后附带写通知，属实现细节，不改 user-follow 的 spec 级要求。故无需改现有 capability 的 spec。 -->

## Impact

- **后端（go-service）**：新增 `internal/notification/`（model/service/handler）；`internal/follow/service.go` 关注成功后调用通知写入；新增 `notifications` 表 migration；注册通知路由。
- **前端（小程序）**：`src/pages/messages/index.tsx` 顶部加固定系统通知入口；新增系统通知详情页 `src/pages/notifications/`；新增 `src/services/api/notification.ts`；未读态入 store（新增或并入 message store）；系统通知列表项组件（关注类含可点击用户名跳主页）。
- **API**：新增 `GET /api/v1/notifications`（分页列表）、`POST /api/v1/notifications/read`（整体标记已读）、`GET /api/v1/notifications/unread-count`（未读总数 + 最新一条摘要）。
- **依赖**：无新增第三方依赖；复用现有 JWT 鉴权、分页、请求层。
