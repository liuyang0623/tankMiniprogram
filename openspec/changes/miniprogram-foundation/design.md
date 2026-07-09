## Context

「摆烂随笔」小程序前端从零构建，后端 go-service 已提供完整 REST 接口（`/api/v1`，Go+Gin+GORM+MySQL，JWT+微信登录，又拍云上传）。本变更是四拆分 change 的地基层，先落地工程脚手架、设计系统、数据访问层与鉴权，其余特性 change 在其上开发。

约束：
- 微信小程序运行环境（WXSS/逻辑层限制，无完整 DOM/BOM）
- 包管理与脚本统一使用 bun
- 视觉要求「新颖、富动效、设计感强」，用 ui-ux-pro-max 产出设计系统
- 发布文章需富文本（微信 `editor` 组件，本地基层仅预留能力，具体在 publish change 落地）
- 后端契约固定，前端不改后端

## Goals / Non-Goals

**Goals:**
- 可编译预览的 Taro 4 + React + bun 工程，appid 配置就绪
- 一套基于 weapp-tailwindcss + ui-ux-pro-max 的设计 token 与基础组件、动效原语
- 统一 HTTP 客户端（baseURL/JWT 注入/401 处理/响应解包/规范化错误）+ Zustand store + 后端契约类型
- 微信登录换 JWT、登录态持久化与守卫、未登录浏览兜底
- 为后续 3 个特性 change 提供稳定复用基础

**Non-Goals:**
- 不实现具体业务页面（信息流/详情/发布/个人中心）的完整功能——留给后续 change
- 不改动或部署 go-service 服务端
- 不做多端（H5/App）输出、消息推送、支付、IM

## Decisions

**D1. 框架：Taro 4 + React（而非 uni-app / 原生 Skyline）**
- 理由：React 生态最契合 ui-ux-pro-max（其按 React/Tailwind 产出设计），bun 构建原生支持，组件化强。
- 备选：Taro+Vue3（Vue 更简洁但 React 动画生态更丰富）；uni-app（多端强但编译层重、ui-ux-pro-max 适配需额外转换）；原生+Skyline（性能最佳但 bun/ui-ux-pro-max 价值受限、自绘成本高）。

**D2. 样式：weapp-tailwindcss + 自绘设计系统（而非 NutUI 现成组件）**
- 理由：Tailwind 原子类 + ui-ux-pro-max 设计 token 自绘，设计自由度最高，才能做出「新颖独特」的视觉与动效。
- 备选：NutUI React（开发快但独特性弱）；NutUI+Tailwind 混搭（折中，可在特性阶段按需引入）。

**D3. 状态/请求：Zustand + 自封装 request（基于 Taro.request）**
- 理由：Zustand 轻量、React 契合、心智负担小；自封装 request 精确匹配后端 Bearer 认证与统一响应结构。
- 备选：Redux Toolkit + RTK Query（规范但样板多，对本项目偏重）；Jotai/Valtio（原子化，生态略逊）。

**D4. 联调：按 go-service 真实接口契约开发，baseURL 可切换**
- 理由：用户要求按真实契约开发；当前不拉起服务端。请求层从一开始就对齐真实接口结构，避免后期改造。
- 处理：环境配置提供可切换 baseURL；开发默认 `http://localhost:3000/api/v1`。

**D5. 鉴权模型：公开/受保护双轨**
- 理由：后端接口本身区分公开（列表/详情）与受保护（发布/互动/profile）。前端据此做未登录浏览兜底 + 受保护操作登录守卫，匹配后端路由分组。

## Risks / Trade-offs

- [weapp-tailwindcss 与 Taro 4 版本兼容/配置踩坑] → 地基阶段先跑通最小样式闭环再铺开，锁定可用版本组合
- [ui-ux-pro-max 产出为 Web/React 设计，小程序 WXSS 有限制（不支持部分 CSS 特性）] → 设计 token 落地时做小程序端可行性校验，动效优先用 transform/opacity 等小程序友好属性
- [服务端未启动，微信登录换 JWT 无法端到端联调] → 请求层与登录流程按真实契约实现，提供开发态可切换 baseURL 与登录态注入位，待服务端就绪后联调
- [富文本 editor 产出格式与后端 text 存储/回显一致性] → 地基仅预留，具体在 publish change 验证图文混排回显

## Migration Plan

不涉及线上迁移（全新工程）。回滚策略：地基代码位于独立 change 分支，未合并前不影响任何现有产物；openspec change 可归档或废弃。

## Open Questions

- weapp-tailwindcss 与当前 Taro 4 小版本的确切兼容组合（build 阶段验证并锁定）
- 是否需要在地基层就引入 lottie 等重动效库，还是先用 CSS 动效满足（倾向后者，特性阶段按需再评估）
- 服务端本地启动所需的微信 secret / 又拍云配置由谁提供、何时联调（联调时机待定）
