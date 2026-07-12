## Context

「摆烂随笔」体验优化 change，纯前端。复用现有设计系统、`Transition`/`Skeleton` 组件、`authStore`、`logout()`、请求层 401 机制。4 项优化中，设置抽屉是主要新增，其余为既有页面的展示/交互打磨。暗黑模式已剥离到后续独立 change，本次仅保留主题切换入口占位。

现状核对：
- 详情页已有 `<Skeleton rows={6}>` 通用骨架（`pages/detail/index.tsx`），需升级为结构化
- 草稿箱删除按钮在 `PostCard` 外单独一行（`pages/drafts/index.tsx`）
- 请求层 401 走 `onUnauthorized` 回调清登录态（`request.ts`/`authRequest.ts`/`upload.ts`），发布页目前 catch 后统一 showToast「发布失败」，未区分 401
- 个人中心退出登录在页面滚动底部、草稿箱入口在 Tab 上方（`pages/profile/index.tsx`）
- 颜色 token 在 tailwind.config.js 写死 + tokens.scss CSS 变量镜像

## Goals / Non-Goals

**Goals:** 详情页结构化骨架屏、草稿删除按钮内移、发布 401 登录过期优化、个人中心右侧全屏设置抽屉（主题入口占位/草稿箱/退出登录）。

**Non-Goals:** 不做暗黑模式本身（后续 change）；不改 go-service；不做主题自定义、多主题；不重构请求层整体错误处理。

## Decisions

**D1. 详情页结构化骨架**
- 新增 `DetailSkeleton` 组件（或就地拼装）：标题条（宽块）+ 头像圆 + 昵称条 + 若干正文行块，复用 `Skeleton` 的底色/动画 token。替换现有 `<Skeleton rows={6}>`。

**D2. 草稿删除按钮内移**
- 方案：`PostCard` 增加可选 `action` slot/props（如 `renderAction` 或 `topRight`），草稿箱传入删除按钮渲染到卡片内部右上角；点击删除 `stopPropagation` 不触发卡片跳转。
- 替代：不改 PostCard，在草稿箱用绝对定位把删除按钮叠加到卡片内。倾向前者（PostCard 增可选 action，语义清晰、可复用），design 阶段深化。

**D3. 发布 401 登录过期优化**
- 请求层已在 401 时 `onUnauthorized`（清登录态）+ 抛 `ApiError(401)`。发布页 `submit`/自动保存 catch 时判断 `err.code === 401`：
  - 发布时 401：`showModal`/明确提示「登录已过期，请重新登录」→ 触发 `login()`，成功后可重试；编辑内容（title/正文）保留在 state 不清空
  - 自动保存时 401：`useDraftAutosave` 的 catch 里静默转提示态（不弹窗打断），SaveStatus 显示「登录已过期」，保留内容
- `ApiError` 已带 `code`，前端按 code 分支即可，无需改请求层。

**D4. 设置抽屉（右侧全屏滑入）**
- 新增 `SettingsDrawer` 组件：全屏遮罩（`fixed inset-0` 半透明）+ 右侧滑入面板（`transform: translateX(100%)→0`，仅 transform/opacity 动效）。复用 `Transition` 或自绘。
- 内容自上而下：主题切换入口（占位，点击 showToast「敬请期待」或禁用态）、草稿箱入口（navigateTo drafts）、退出登录（置底，二次确认 logout）。
- 个人中心加设置按钮（右上角图标），打开抽屉；移除页面底部退出登录与 Tab 上方草稿箱入口。

## Risks / Trade-offs

- [全屏抽屉遮罩滚动穿透] → 遮罩层 `catchMove`/阻止背景滚动
- [PostCard 加 action 影响既有信息流/我的帖子展示] → action 为可选，不传则与现状一致；回归验证信息流卡片
- [401 提示与请求层 clear() 时序] → clear() 已在请求层执行，前端只补提示与引导，注意 isLogin 已变 false 的 UI 一致
- [主题入口占位与下个 change 衔接] → 占位组件预留清晰位置，暗黑 change 接入切换逻辑

## Migration Plan

无。新分支开发，复用既有基础。

## Open Questions

- 设置按钮图标形态（齿轮 icon / 文字「设置」）——build 阶段定
- 主题入口占位交互（showToast「敬请期待」vs 灰色禁用）——build 阶段定，倾向禁用态 + 小字「即将上线」
- PostCard action 注入方式（renderAction 函数 vs children slot）——build 阶段定
