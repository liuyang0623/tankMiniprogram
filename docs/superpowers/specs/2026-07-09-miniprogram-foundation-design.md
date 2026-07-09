---
comet_change: miniprogram-foundation
role: technical-design
canonical_spec: openspec
---

# miniprogram-foundation 技术设计

> 深度技术设计，深化 `openspec/changes/miniprogram-foundation/design.md` 的高层框架。需求与验收场景以 `openspec/changes/miniprogram-foundation/specs/*/spec.md` 为准，本文档不重复定义需求。

## 1. 概览

「摆烂随笔」小程序前端地基层，为后续 3 个特性 change（feed/detail、publish、profile）提供脚手架、设计系统、数据访问层与鉴权。视觉方向：温柔治愈系（用户确认方向 A）。

分层：
```
pages/ ── components/(设计系统) ── store/(Zustand) ── services/(request + api) ── go-service /api/v1
```

## 2. 工程脚手架

- **框架**：Taro 4 + React 18 + TypeScript，编译目标微信小程序（weapp）
- **包管理**：bun（`bun install` / `bun run dev:weapp` / `bun run build:weapp`）
- **appid**：`wx555c14bc9d837e27`（`project.config.json`）
- **目录**：
  ```
  config/            # Taro 编译配置 + env.ts（可切换 baseURL）
  src/
    app.config.ts    # 全局路由 + TabBar
    app.tsx / app.scss
    pages/           # index(首页) / publish(发布占位) / profile(我的)
    components/      # 设计系统基础组件
    store/           # Zustand: auth / ui
    services/        # request.ts + api/*.ts
    types/           # api.ts 契约类型
    styles/          # tokens.scss + tailwind 主题
  ```
- **环境**：`config/env.ts` 按 `process.env.TARO_APP_ENV` 导出 `BASE_URL`；dev 默认 `http://localhost:3000/api/v1`

## 3. 设计系统

### 3.1 设计 token（`styles/tokens.scss` + tailwind.config）

| 类别 | 值 |
|------|-----|
| 背景 | `#FAF6F0`（页面）/ `#FFFFFF`·`#FEFCF9`（卡片） |
| 主强调（奶橘） | `#F0A868` |
| 次强调（藕粉） | `#E4A9BE` |
| 点缀（雾霾蓝） | `#A6C0CE` |
| 文字 | `#4A413A`（主）/ `#8A7F76`（次） |
| 互动暖红 | `#EF8A7F` |
| 字号(rpx) | 24/28/32/36/44/56（对应 12–28px 语义档） |
| 圆角 | 卡片 24rpx / 按钮 pill·16rpx / 头像全圆 |
| 阴影 | `0 8rpx 24rpx rgba(74,65,58,0.08)` |

token 同时注入 Tailwind theme（`colors`/`borderRadius`/`boxShadow`/`fontSize`），业务代码优先用原子类，避免硬编码。

### 3.2 基础组件（`components/`）
- `Button`（primary/ghost/pill，按压 scale 0.97）
- `Card`（圆角+柔和阴影，可选浮动动效）
- `Avatar`、`Tag`（话题标签）
- `Skeleton` / `SkeletonList`（shimmer 骨架屏）
- `Toast`（由 `useUiStore` 驱动）
- `Transition`（fade+translateY 进场包装）

### 3.3 动效原语（`styles/motion.scss`）
- 进场：`fadeInUp`（opacity 0→1 + translateY 16rpx→0）
- 呼吸/浮动：卡片 subtle `translateY` 循环
- 按压：`:active` scale 0.97 + opacity
- 骨架屏：`shimmer` 背景位移
- 约束：仅用 `transform`/`opacity`；时长 200–400ms；`cubic-bezier(0.22,1,0.36,1)`

## 4. 数据访问层

### 4.1 request 客户端（`services/request.ts`）
职责单一的 HTTP 封装，接口：`request<T>(options): Promise<T>`。
- 拼接 `BASE_URL + url`
- 注入 `Authorization: Bearer <token>`（从 `authStore` 读，存在才注入）
- 响应解包：后端统一结构 `{ code, data, message }`（以实际契约为准）→ 成功返回 `data`，失败抛规范化 `ApiError{ code, message, httpStatus }`
- 401 分支：调用 `authStore.clear()` 并触发登录引导（通过 `uiStore` 或事件），再抛错
- 网络异常：包装为 `ApiError`

**边界条件**：token 为空时不注入头（匿名请求）；解包时 `code` 非成功值也走错误分支；上传接口（`multipart`）单独用 `Taro.uploadFile` 封装，复用鉴权头与错误处理。

### 4.2 API 方法（`services/api/*.ts`）
按后端模块分文件，导出类型化方法（签名先行，具体实现由消费方 change 逐步用到）：
- `auth.ts`：`wechatLogin(code)`
- `users.ts`：`getUser(id)` / `getProfile()` / `updateProfile(body)` / `getUserPosts(id, page)`
- `posts.ts`：`findAll(query)` / `findOne(id)` / `create(body)` / `update(id,body)` / `remove(id)` / `publish(id)` / `findDrafts()` / `findMyPosts()`
- `interactions.ts`：`likePost(id)` / `favoritePost(id)` / `getFavorites()` / `getComments(postId)` / `createComment(body)` / `deleteComment(id)`
- `upload.ts`：`uploadImage(filePath)` / `uploadFile(filePath)`

### 4.3 契约类型（`types/api.ts`）
对齐后端 GORM 模型：`User`、`Post`（含 `status: 'DRAFT'|'PUBLISHED'`、`viewCount/likeCount/commentCount`、`images`、`topics`、`author`）、`PostImage`、`Topic`、`Comment`（含 `parentId`/`replies`）、`Like`、`Favorite`、分页包裹、`AuthResponse{ token, user }`。

### 4.4 状态（`store/`）
- `useAuthStore`：`{ token, user, isLogin, setAuth(), clear(), restore() }`，token/user 持久化到 `Taro.setStorageSync`
- `useUiStore`：`{ globalLoading, toast(msg,type), login gate 事件 }`

## 5. 微信登录鉴权

流程：
```
wx.login() → code → POST /api/v1/auth/wechat/login {code}
   → { token, user } → authStore.setAuth() + Storage 持久化
```
- **启动恢复**：`app.tsx` onLaunch 调用 `authStore.restore()` 从 Storage 读回
- **公开/受保护双轨**：列表/详情匿名可访问（不触发登录）；发布/互动/我的 在动作入口检查 `isLogin`，未登录弹登录引导
- **401 失效**：request 层清态 + 引导重登
- **边界**：`wx.login` 失败、code 换取失败、token 过期分别给用户可读提示，不写入无效态

## 6. 测试策略

- **单元（vitest）**：
  - `request`：JWT 注入分支、响应解包、错误规范化、401 清态触发
  - `authStore`：setAuth/clear/restore、持久化读写
- **类型**：`tsc --noEmit` 校验契约类型
- **手动冒烟**：微信开发者工具编译预览 → TabBar 切换、设计 token 呈现、骨架屏动效、一条公开接口（`GET /posts`）调用链解包
- 不做 E2E（小程序 E2E 成本高，留后续特性阶段评估）

## 7. 技术风险与缓解

| 风险 | 缓解 |
|------|------|
| weapp-tailwindcss × Taro 4 版本兼容踩坑 | 先跑最小样式闭环，锁定可用版本组合再铺开 |
| ui-ux-pro-max 产出为 Web，WXSS 不支持部分 CSS | token 落地做小程序端可行性校验；动效限 transform/opacity |
| 服务端未启动，登录换 JWT 无法端到端联调 | 请求层/登录流程按真实契约实现，预留可切换 baseURL，待服务端就绪联调 |
| 后端统一响应结构未最终确认 | 实现时以 go-service handler 实际返回为准，解包逻辑集中在 request 层便于统一调整 |

## 8. 非目标（YAGNI）

暗色模式、具体业务页面完整功能、lottie 等重动效库、多端（H5/App）输出、E2E —— 均不在地基层范围。
