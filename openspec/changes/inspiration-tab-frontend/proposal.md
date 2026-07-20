## Why

「灵感」是小程序新增的第 5 个 tab，承载 4 个轻互动板块（测运势、今天吃什么、解惑、运动计划），为「摆烂随笔」的温柔治愈系体验补充趣味与陪伴感。后端解惑/运动计划 API 已就绪（change `inspiration-backend-api`），前端需落地页面并接入。

用户明确要求：这四个板块都要有**较好的交互动效与视觉美感**，不能是静态朴素页面。

## What Changes

- 在 `app.config.ts` 新增第 5 个 tabBar 项「灵感」及对应图标资源。
- 新增灵感主页 `pages/inspiration/index`：4 个板块入口卡片，进场动效 + 按压反馈。
- **测运势**（纯前端）：抽签/揭晓仪式感动画，本地随机运势结果。
- **今天吃什么**（纯前端）：老虎机滚动抽取动画，本地菜品数据随机推荐。
- **解惑**（接后端）：全站问题列表 + 详情（含回答）+ 提问 + 回答，卡片错位淡入。
- **运动计划**（接后端）：目标列表 + 创建 + 打卡，环形进度动画 + 打卡庆祝反馈。
- 新增 `services/api/inspiration.ts` 与 `types/inspiration.ts`，接入统一到 `api/index.ts`。
- 扩展 `styles/motion.scss` 增加本功能所需动效原语（翻转、滚动、庆祝等）。

## Capabilities

### New Capabilities
- `inspiration-entry`: 灵感 tab 与主页入口——tabBar 项、主页 4 板块卡片导航。
- `fortune-game`: 测运势小游戏——纯前端随机运势与抽签动效。
- `food-picker`: 今天吃什么——纯前端菜品随机推荐与滚动动效。
- `qa-frontend`: 解惑问答前端——列表/详情/提问/回答，接后端 API。
- `sport-plan-frontend`: 运动计划前端——目标列表/创建/打卡，接后端 API。

### Modified Capabilities
<!-- 无既有能力的需求变更；app-scaffold 的 tabBar 扩展在实现层处理 -->

## Impact

- **新增页面**：`pages/inspiration/{index,fortune,food,qa,qa-detail,sport}`（tsx + config[+ scss]）
- **新增服务/类型**：`services/api/inspiration.ts`、`types/inspiration.ts`
- **修改**：`app.config.ts`（tabBar +1）、`services/api/index.ts`（导出）、`styles/motion.scss`（动效）
- **资源**：新增 `assets/tabbar/inspiration.png` 与 `inspiration-active.png`
- **依赖**：无新增第三方依赖，复用 Taro 组件与现有设计体系
- **API**：消费后端 `/questions`、`/sport-goals` 系列端点（均需 JWT）
