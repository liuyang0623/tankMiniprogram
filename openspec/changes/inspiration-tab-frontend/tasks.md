# Tasks: inspiration-tab-frontend

## 1. 基建：类型、API、tab、动效

- [x] 1.1 新增 `types/inspiration.ts`：Question/QuestionListItem/Answer/SportGoal/CheckinResult 及请求体、PaginatedQuestions
- [x] 1.2 新增 `services/api/inspiration.ts`：`qaApi`（list/detail/create/answer）、`sportApi`（list/create/update/checkin）
- [x] 1.3 在 `services/api/index.ts` 导出 qaApi、sportApi
- [x] 1.4 在 `styles/motion.scss` 扩展动效原语：翻转、shake、老虎机滚动、错位延迟、celebrate
- [x] 1.5 新增 tabBar 图标 `assets/tabbar/inspiration.png` 与 `inspiration-active.png`（同风格占位）
- [x] 1.6 在 `app.config.ts` 追加 6 个 inspiration 页面到 pages，tabBar 新增「灵感」项

## 2. 灵感主页

- [x] 2.1 创建 `pages/inspiration/index.tsx` + `index.config.ts`：CustomNavBar + 4 入口卡片
- [x] 2.2 主页样式 `index.scss`：治愈系卡片、错位淡入进场、按压反馈，深浅色适配
- [x] 2.3 卡片点击导航到对应子页面

## 3. 测运势（纯前端）

- [x] 3.1 创建 `pages/inspiration/fortune.tsx` + config：本地运势数据 + 抽签逻辑
- [x] 3.2 抽签揭晓动效：签筒摇动/卡片翻转 + 结果渐显缩放回弹
- [x] 3.3 可重复抽取，样式与主题适配

## 4. 今天吃什么（纯前端）

- [x] 4.1 创建 `pages/inspiration/food.tsx` + config：本地菜品数据 + 随机逻辑
- [x] 4.2 老虎机滚动抽取动效 + 落定回弹高亮
- [x] 4.3 可选分类筛选，样式与主题适配

## 5. 解惑（接后端）

- [x] 5.1 创建 `pages/inspiration/qa.tsx` + config：全站问题列表、错位淡入、空状态、未登录引导
- [x] 5.2 提问入口（弹窗/输入）→ 调 qaApi.create，成功刷新列表
- [x] 5.3 创建 `pages/inspiration/qa-detail.tsx` + config：问题正文 + 回答列表（正序）
- [x] 5.4 回答输入 → 调 qaApi.answer，成功追加到回答列表，空内容前端拦截

## 6. 运动计划（接后端）

- [x] 6.1 创建 `pages/inspiration/sport.tsx` + config：本人目标列表、环形进度动效、未登录引导
- [x] 6.2 创建目标入口 → 调 sportApi.create，名称空拦截，成功刷新
- [x] 6.3 打卡按钮 → 调 sportApi.checkin，成功更新进度 + 庆祝动效；今日已打卡呈现完成态

## 7. 验证

- [x] 7.1 `pnpm tsc --noEmit`（或项目类型检查）通过
- [x] 7.2 `pnpm build:weapp` 构建通过
- [x] 7.3 开发者工具/预览走查四板块动效与主题，解惑+运动计划前后端联调（待人工验证）
