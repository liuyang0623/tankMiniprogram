## Context

小程序基于 Taro + React，已有完整设计体系：`PageLayout`（主题容器，挂 `.theme-light/.theme-dark`）、`CustomNavBar`、Zustand store（auth/ui/theme）、`authRequest<T>` 统一请求、`styles/motion.scss` 动效原语（fadeInUp/shimmer/floating/press）。tabBar 现有 4 项，微信上限为 5，新增「灵感」后正好占满。

后端 `inspiration-backend-api` 已提供解惑/运动计划接口，契约与 `types/api.ts` 的 `Paginated<T>`、`{data,code,message}` 一致。

用户强调四个板块要有**较好的交互动效与视觉美感**——这是本 change 的核心验收维度，不仅是功能正确。

## Goals / Non-Goals

**Goals:**
- 落地灵感 tab + 主页 + 4 板块页面，接入后端两块 API
- 每个板块具备与其气质相符的交互动效（抽签、老虎机、错位淡入、环形进度+庆祝）
- 复用现有设计体系与组件，保持温柔治愈系视觉统一、深浅色主题自适应
- 纯前端板块（测运势/今天吃什么）数据本地写死，零后端依赖

**Non-Goals:**
- 运势/菜品数据的后端化、每日限制、历史记录
- 问答的点赞/评论/删除/编辑、富文本
- 运动目标的社交、排行榜、提醒推送

## Decisions

### 页面与路由
```
pages/inspiration/index      主页（4 入口卡片）
pages/inspiration/fortune    测运势
pages/inspiration/food       今天吃什么
pages/inspiration/qa         解惑（列表 + 提问入口）
pages/inspiration/qa-detail  解惑详情（问题正文 + 回答 + 回答输入）
pages/inspiration/sport      运动计划（列表 + 创建 + 打卡）
```
主页作为 tabBar 目标页用 `navigationStyle: custom` + `CustomNavBar`，与 diary 一致；子页普通 `navigateTo`。

### tabBar 图标
新增 `assets/tabbar/inspiration.png` 与 `inspiration-active.png`，风格/尺寸对齐现有 4 组图标（非选中 `#8A7F76`、选中 `#F0A868`）。若暂无设计稿，先用与现有图标同风格的占位图标，后续替换。

### 动效方案（小程序性能友好，仅 transform/opacity）
在 `styles/motion.scss` 扩展本功能原语，避免散落各页：
- **测运势**：卡片 3D 翻转 `rotateY`（签筒→签文），结果 `fadeInUp` + 短促 `scale` 回弹；抽签中签筒 `shake`。
- **今天吃什么**：候选纵向滚动 `translateY` 缓动到目标项（老虎机），落定 `scale` 回弹 + 高亮描边。
- **解惑**：列表项 `fadeInUp` 按 index 递增 `animation-delay` 实现错位淡入。
- **运动计划**：环形进度用 SVG/`conic-gradient` 过渡宽度；打卡成功触发一次性 `celebrate`（缩放+透明度粒子点缀）。
所有动效以 class 驱动，配合 React state 切换，`will-change: transform` 收敛重绘。

### API 与类型
新增 `types/inspiration.ts`：`Question`/`QuestionListItem`/`Answer`/`SportGoal`/`CheckinResult` 及请求体，`PaginatedQuestions = Paginated<QuestionListItem>`。新增 `services/api/inspiration.ts` 导出 `qaApi`、`sportApi`，统一到 `api/index.ts`。字段与后端 DTO 对齐（如 `answerCount`、`streak`、`totalDays`、`checkedInToday`）。

### 登录与状态
接后端的解惑/运动计划复用 diary 的未登录引导模式（`useAuthStore` + `login()`）；纯前端板块无需登录即可玩。请求失败用 `useUiStore.showToast` 温柔提示。

## Risks / Trade-offs

- [tabBar 达到 5 项上限] → 后续若再加 tab 需改为「更多」聚合页；本期 5 项合规，先直接加。
- [老虎机/翻转动效在低端机掉帧] → 仅用 transform/opacity + 控制动画时长（≤0.4s），不用 JS 逐帧。
- [缺 tab 图标设计稿] → 先用同风格占位，标注 TODO，不阻塞功能。
- [环形进度 conic-gradient 兼容性] → 优先 SVG stroke-dasharray，回退为水平进度条。

## Migration Plan

- 纯增量：新增页面与资源，`app.config.ts` 追加 pages 与 tabBar 项。
- 回滚：移除 tabBar 项与新增 pages 即可，不影响既有页面。

## Open Questions

- tab 图标是否有正式设计稿？暂用占位，后续替换。
- 测运势/菜品文案内容是否需产品提供？先内置一份治愈系默认文案。
