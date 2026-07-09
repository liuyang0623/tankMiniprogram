# Brainstorm Summary

- Change: miniprogram-foundation
- Date: 2026-07-09

## 确认的技术方案

**技术栈**（open 阶段已选，design 阶段沿用）
- Taro 4 + React + TypeScript，bun 包管理
- weapp-tailwindcss + ui-ux-pro-max 自绘设计系统
- Zustand + 基于 Taro.request 的自封装请求层
- 按 go-service 真实接口契约开发，baseURL 可切换（dev 默认 `http://localhost:3000/api/v1`）

**视觉方向：温柔治愈系（用户确认方向 A）**
- 配色：奶油米白底 `#FAF6F0`；卡片 `#FFFFFF`/`#FEFCF9` + 柔和多层阴影；主强调奶橘 `#F0A868`、次强调藕粉 `#E4A9BE`、点缀雾霾蓝 `#A6C0CE`；文字深棕灰 `#4A413A`/`#8A7F76`；互动暖红 `#EF8A7F`
- 字号：12/14/16/18/22/28（rpx），靠字重+字号拉层级
- 圆角：卡片 24rpx、按钮 pill/16rpx、头像全圆
- 阴影：`0 8rpx 24rpx rgba(莫兰迪,0.08)`
- 动效：进场 fade+上浮、卡片呼吸/浮动、按压 scale 0.97、骨架屏 shimmer；优先 transform/opacity，200–400ms ease-out

**架构分层**
- 工程：`src/{pages,components,store,services,types,styles}` + `config/`；TabBar 首页/发布/我的
- 数据层：`services/request.ts`（baseURL/JWT 注入/响应解包/401 处理）+ `services/api/*`（按后端模块分文件）+ `types/api.ts`（契约类型）
- 状态：`useAuthStore`（token/user/登录态）+ `useUiStore`（loading/toast）
- 鉴权：`wx.login`→code→换 JWT→Storage+Zustand 持久化；启动恢复；公开/受保护双轨（匿名可浏览列表详情，受保护操作引导登录）

## 关键取舍与风险

- Taro+React 而非 uni-app/原生 Skyline：契合 ui-ux-pro-max 与 bun，动效生态更好
- weapp-tailwindcss 自绘而非 NutUI：设计自由度换开发速度，为「设计感满满」让路
- [weapp-tailwindcss × Taro 4 版本兼容] → 先跑最小样式闭环锁版本
- [ui-ux-pro-max 产出为 Web，WXSS 有限制] → token 落地做小程序端可行性校验，动效限 transform/opacity
- [服务端未启动，登录换 JWT 无法端到端联调] → 请求层与登录流程按真实契约实现，预留可切换 baseURL，待服务端就绪联调

## 测试策略

- 单元（vitest）：request 拦截逻辑（JWT 注入/响应解包/401 分支）、Zustand store action
- 类型：tsc 编译校验接口契约类型
- 手动冒烟：微信开发者工具编译预览，验证 TabBar、样式 token、骨架屏动效、一条公开接口调用链
- 不做 E2E（小程序 E2E 成本高，留后续）

## 非目标（YAGNI）

地基层不做暗色模式、不做具体业务页面完整功能、不引入 lottie 等重动效库（先用 CSS 动效）。

## Spec Patch

无（brainstorming 未发现 delta spec 需回写；地基层 4 份 spec 的验收场景已覆盖核心与边界）。
