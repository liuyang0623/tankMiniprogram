# Comet Design Handoff

- Change: miniprogram-foundation
- Phase: design
- Mode: compact
- Context hash: f88d5ea706389fd87dfae3922e64786dc9145d549d24458496865f865acc75f5

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/miniprogram-foundation/proposal.md

- Source: openspec/changes/miniprogram-foundation/proposal.md
- Lines: 1-36
- SHA256: 18493d20be817bdc08c81e44679679ed92c65840cf67736a195ecacd0f08ff75

```md
## Why

「摆烂随笔」是一个全新的微信小程序（appid `wx555c14bc9d837e27`），后端 go-service 已实现完整的 REST 接口（认证、用户、帖子、互动、上传），但前端尚不存在。在开发信息流、发布、个人中心等特性之前，必须先建立一套稳固的工程地基：项目脚手架、可复用的设计系统、统一的数据访问层与登录鉴权。地基不先落地，后续每个特性都会重复造轮子且风格不一致。

本变更是四个拆分 change 中的第 1 个（地基先行），其后 `article-feed-and-detail`、`article-publish-richtext`、`user-profile-center` 均依赖本变更产出的设计系统、请求层与鉴权状态。

## What Changes

- 初始化 **Taro 4 + React + bun** 小程序工程，配置微信 appid、TabBar、路由骨架与基础页面占位
- 建立 **weapp-tailwindcss + ui-ux-pro-max 设计系统**：设计 token（配色/字号/间距/圆角/阴影）、基础 UI 组件与动效/转场/骨架屏原语，支撑「新颖、富动效、设计感强」的视觉基调
- 封装 **数据访问层**：基于 `Taro.request` 的 HTTP 客户端（baseURL 指向 go-service `/api/v1`、JWT 注入、401 处理、统一错误与响应解包），Zustand 全局 store，以及与后端契约对齐的 TypeScript 类型
- 实现 **微信登录鉴权**：`wx.login` 取 code → `POST /auth/wechat/login` 换 JWT → 持久化 token 与用户态，提供登录态守卫与未登录浏览兜底
- 约定项目工程规范：目录结构、bun 脚本、环境配置（可切换 baseURL）、TypeScript 与样式规范

不涉及后端改动；数据契约以 go-service 已实现接口为准，本变更不新增后端接口。

## Capabilities

### New Capabilities

- `app-scaffold`: Taro 4 + React + bun 小程序工程脚手架，含微信 appid 配置、TabBar、路由与基础页面骨架、bun 构建脚本、环境配置
- `design-system`: 基于 weapp-tailwindcss 与 ui-ux-pro-max 的设计系统，含设计 token、基础 UI 组件库与动效/转场/骨架屏原语
- `data-access`: 统一数据访问层，含 `Taro.request` HTTP 客户端（JWT 注入 / 401 处理 / 统一错误）、Zustand store 与 go-service 接口契约类型
- `wechat-auth`: 微信小程序登录鉴权，含 `wx.login` 换 JWT、token 与用户态持久化、登录态守卫与未登录浏览兜底

### Modified Capabilities

<!-- 无。openspec/specs/ 当前为空，本变更不修改任何既有能力的需求。 -->

## Impact

- **新增前端工程**：在项目根初始化 Taro 小程序代码（`src/`、`config/`、`project.config.json` 等），使用 bun 管理依赖
- **依赖**：`@tarojs/taro`、`@tarojs/react`、`react`、`zustand`、`weapp-tailwindcss`、`tailwindcss`、以及 Taro 微信小程序编译工具链
- **对接后端**：消费 go-service `/api/v1`（`http://localhost:3000/api/v1` 为默认开发地址，可通过环境配置切换）
- **鉴权契约**：所有受保护接口通过 `Authorization: Bearer <jwt>` 访问，token 由微信登录换取
- **后续 change 依赖**：`article-feed-and-detail`、`article-publish-richtext`、`user-profile-center` 复用本变更的设计系统、请求层与鉴权状态

```

## openspec/changes/miniprogram-foundation/design.md

- Source: openspec/changes/miniprogram-foundation/design.md
- Lines: 1-62
- SHA256: 883ab5a31d783cfe270832537a2f43d975f4149fd18142d79bb57a8f7457ebde

```md
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

```

## openspec/changes/miniprogram-foundation/tasks.md

- Source: openspec/changes/miniprogram-foundation/tasks.md
- Lines: 1-42
- SHA256: eac19bede907ded9c1b556db855953d575d31668f09254eef50424a17542ea20

```md
# Implementation Tasks — miniprogram-foundation

## 1. 工程脚手架（app-scaffold）

- [ ] 1.1 用 Taro 4 + React + TypeScript 初始化小程序工程，bun 作为包管理器（`bun install` 通过）
- [ ] 1.2 配置微信 appid `wx555c14bc9d837e27`（`project.config.json` / Taro 编译配置）
- [ ] 1.3 建立目录结构：`src/pages`、`src/components`、`src/store`、`src/services`、`src/types`、`src/styles`、`config/`
- [ ] 1.4 配置多环境（dev/prod）可切换 baseURL，dev 默认 `http://localhost:3000/api/v1`
- [ ] 1.5 搭建 TabBar 与路由骨架：首页、发布、个人中心三个主入口 + 占位页面
- [ ] 1.6 编写 bun 脚本（dev/build 微信端）并验证可编译出微信开发者工具可加载的产物

## 2. 设计系统（design-system）

- [ ] 2.1 集成 weapp-tailwindcss + tailwindcss，跑通最小样式闭环（原子类在小程序端正确渲染）
- [ ] 2.2 用 ui-ux-pro-max skill 产出设计方向与设计 token（配色/字号/间距/圆角/阴影），落为可复用变量与 Tailwind 主题配置
- [ ] 2.3 实现基础 UI 组件：按钮、卡片、头像、标签（Tag/话题）、Toast/反馈
- [ ] 2.4 实现加载态骨架屏组件与列表骨架
- [ ] 2.5 实现动效/转场原语：页面/元素进场过渡、按压反馈（优先 transform/opacity 等小程序友好属性）
- [ ] 2.6 建立组件预览/展示页，验证 token 与组件在真机/模拟器的视觉与动效

## 3. 数据访问层（data-access）

- [ ] 3.1 基于 `Taro.request` 封装 HTTP 客户端：baseURL 拼接、通用请求头、统一响应解包、规范化错误
- [ ] 3.2 实现 JWT 注入拦截：受保护请求自动附加 `Authorization: Bearer <jwt>`
- [ ] 3.3 实现 401 处理：清除本地登录态并触发重新登录流程
- [ ] 3.4 建立 Zustand 全局 store：用户/鉴权态（token、用户信息、登录状态）
- [ ] 3.5 编写 go-service `/api/v1` 接口契约的 TypeScript 类型（User/Post/PostImage/Topic/Comment/Like/Favorite/分页/鉴权响应）
- [ ] 3.6 封装各接口的 service 方法签名（auth/users/posts/interactions/upload），供后续 change 复用

## 4. 微信登录鉴权（wechat-auth）

- [ ] 4.1 实现 `wx.login` 取 code → `POST /auth/wechat/login` 换 JWT 的登录流程
- [ ] 4.2 登录成功后写入 Zustand 登录态并持久化 token 与用户信息到本地存储
- [ ] 4.3 小程序启动时从本地存储恢复登录态（token 未失效时自动登录）
- [ ] 4.4 实现登录态守卫与未登录浏览兜底：公开内容可浏览，受保护操作引导登录
- [ ] 4.5 处理登录失败与 401 失效场景的用户提示与状态清理

## 5. 联通与验证

- [ ] 5.1 用真实接口契约打通一次可运行调用链（列表类公开接口）验证请求层解包与错误处理
- [ ] 5.2 校验设计系统在小程序端的动效表现符合「富动效、设计感」预期
- [ ] 5.3 整理 README：工程说明、bun 脚本、环境切换、目录约定，供后续特性 change 参考

```

## openspec/changes/miniprogram-foundation/specs/app-scaffold/spec.md

- Source: openspec/changes/miniprogram-foundation/specs/app-scaffold/spec.md
- Lines: 1-33
- SHA256: 27cac14a3796aea227b1bfb11fe810c0a8583944e23982ea4a9c57593d59fbc0

```md
## ADDED Requirements

### Requirement: Taro + React + bun 工程脚手架

系统 SHALL 使用 Taro 4 + React 初始化微信小程序工程，并使用 bun 作为包管理与脚本运行工具。工程 MUST 配置微信 appid `wx555c14bc9d837e27`，且能通过微信开发者工具编译预览。

#### Scenario: 全新工程可编译运行

- **WHEN** 开发者在项目根执行 `bun install` 后运行 Taro 微信端编译命令
- **THEN** 系统 SHALL 产出可被微信开发者工具加载的 `dist`（或等价输出），且首页可正常渲染无编译错误

#### Scenario: appid 已正确配置

- **WHEN** 微信开发者工具打开编译产物
- **THEN** 项目配置中的 appid SHALL 为 `wx555c14bc9d837e27`

### Requirement: TabBar 与路由骨架

系统 SHALL 提供底部 TabBar 导航与页面路由骨架，至少包含首页、发布、个人中心三个主入口，未实现的页面以占位内容呈现。

#### Scenario: TabBar 切换主页面

- **WHEN** 用户点击 TabBar 上的某个入口
- **THEN** 系统 SHALL 切换到对应页面且不报错

### Requirement: 环境配置可切换

系统 SHALL 支持通过环境配置切换后端 baseURL，开发默认指向 go-service `http://localhost:3000/api/v1`。

#### Scenario: 切换后端地址

- **WHEN** 开发者修改环境配置中的 baseURL 并重新编译
- **THEN** 后续网络请求 SHALL 使用新的 baseURL，无需改动业务代码

```

## openspec/changes/miniprogram-foundation/specs/data-access/spec.md

- Source: openspec/changes/miniprogram-foundation/specs/data-access/spec.md
- Lines: 1-47
- SHA256: 6edb5c1a418bb01e7f15cf2a45dba8946f940ca7caa709abc724c9cc4efbc177

```md
## ADDED Requirements

### Requirement: HTTP 客户端封装

系统 SHALL 提供基于 `Taro.request` 的统一 HTTP 客户端，自动拼接 baseURL、附加通用请求头，并对 go-service 统一响应结构进行解包，向调用方返回业务数据或规范化错误。

#### Scenario: 成功请求解包数据

- **WHEN** 调用方发起一个成功的接口请求
- **THEN** 客户端 SHALL 返回解包后的业务数据，而非原始响应包裹结构

#### Scenario: 请求失败返回规范化错误

- **WHEN** 接口返回非成功状态或网络异常
- **THEN** 客户端 SHALL 抛出/返回统一结构的错误对象，包含可读错误信息供上层处理

### Requirement: JWT 注入与鉴权失效处理

对受保护接口，系统 SHALL 自动注入 `Authorization: Bearer <jwt>` 请求头；当服务端返回 401 时，SHALL 清除本地登录态并触发重新登录流程。

#### Scenario: 受保护请求注入 token

- **WHEN** 已登录用户调用受保护接口
- **THEN** 请求 SHALL 携带 `Authorization: Bearer <jwt>` 头

#### Scenario: 401 触发重新登录

- **WHEN** 服务端对某请求返回 401
- **THEN** 系统 SHALL 清除本地 token 与用户态，并引导用户重新登录

### Requirement: Zustand 全局状态

系统 SHALL 使用 Zustand 管理全局状态，至少提供用户/鉴权态 store，供全局组件读取与更新。

#### Scenario: 全局读取登录态

- **WHEN** 任一页面或组件读取当前登录态
- **THEN** 系统 SHALL 从 Zustand store 返回一致的登录状态与用户信息

### Requirement: 后端接口契约类型

系统 SHALL 为 go-service `/api/v1` 已实现接口提供 TypeScript 类型（用户、帖子、评论、点赞、收藏、话题、分页等），使数据消费具备类型约束。

#### Scenario: 类型约束接口数据

- **WHEN** 业务代码消费接口返回数据
- **THEN** 该数据 SHALL 具备与后端模型对齐的 TypeScript 类型，字段不匹配时在编译期暴露

```

## openspec/changes/miniprogram-foundation/specs/design-system/spec.md

- Source: openspec/changes/miniprogram-foundation/specs/design-system/spec.md
- Lines: 1-37
- SHA256: c2355ed05589b599645b14f00e5f6eb4deac19ef44dec96310c8d5ee916eac96

```md
## ADDED Requirements

### Requirement: 设计 token 体系

系统 SHALL 建立一套基于 ui-ux-pro-max 产出的设计 token，覆盖配色、字号、间距、圆角与阴影，并以可复用变量形式提供给全局样式与组件。token MUST 支撑「新颖、富动效、设计感强」的统一视觉基调。

#### Scenario: 组件消费统一 token

- **WHEN** 任一基础组件引用配色/间距/圆角样式
- **THEN** 该样式 SHALL 来自设计 token，而非页面内硬编码的魔法数值

### Requirement: weapp-tailwindcss 原子化样式

系统 SHALL 集成 weapp-tailwindcss，使 Tailwind 原子类可在小程序 WXSS 环境中生效，作为自绘组件的主要样式手段。

#### Scenario: Tailwind 原子类在小程序端渲染

- **WHEN** 在组件中使用 Tailwind 原子类并编译到微信小程序
- **THEN** 对应样式 SHALL 正确呈现，无未转换的原子类残留

### Requirement: 基础 UI 组件库

系统 SHALL 提供一组自绘基础组件（至少含按钮、卡片、头像、标签、加载态骨架屏），组件遵循设计 token 且可被后续特性页面复用。

#### Scenario: 复用基础组件

- **WHEN** 特性页面引用基础组件并传入内容
- **THEN** 组件 SHALL 按设计 token 渲染且支持基础交互态（如按压反馈）

### Requirement: 动效与转场原语

系统 SHALL 提供可复用的动效原语，至少覆盖页面/元素进场过渡与列表骨架屏加载动画，为「富动效」体验提供统一基础。

#### Scenario: 内容加载展示骨架屏

- **WHEN** 页面数据处于加载中状态
- **THEN** 系统 SHALL 展示骨架屏动画，数据就绪后平滑过渡到真实内容

```

## openspec/changes/miniprogram-foundation/specs/wechat-auth/spec.md

- Source: openspec/changes/miniprogram-foundation/specs/wechat-auth/spec.md
- Lines: 1-38
- SHA256: 4919efd1c0ae385f279218702b6263714038349629fb1a1f7b4c8035d4a112e3

```md
## ADDED Requirements

### Requirement: 微信登录换取 JWT

系统 SHALL 通过 `wx.login` 获取临时 code，调用 `POST /api/v1/auth/wechat/login` 换取 JWT 与用户信息，用于后续受保护接口鉴权。

#### Scenario: 首次登录成功

- **WHEN** 用户触发登录且 `wx.login` 返回有效 code
- **THEN** 系统 SHALL 调用登录接口换取 JWT，并将用户信息写入全局登录态

#### Scenario: 登录接口失败

- **WHEN** 登录接口返回错误或网络失败
- **THEN** 系统 SHALL 提示登录失败且不写入无效登录态

### Requirement: 登录态持久化

系统 SHALL 将 JWT 与基本用户信息持久化到本地存储，小程序重启后 SHALL 自动恢复登录态而无需重新登录（token 未失效时）。

#### Scenario: 重启恢复登录态

- **WHEN** 已登录用户关闭并重新打开小程序，且本地 token 未失效
- **THEN** 系统 SHALL 从本地存储恢复登录态，用户处于已登录状态

### Requirement: 登录态守卫与未登录浏览兜底

系统 SHALL 区分公开与受保护操作：公开内容（如帖子列表、详情）允许未登录浏览；受保护操作（发布、点赞、收藏、评论、个人中心）在未登录时 SHALL 引导用户登录。

#### Scenario: 未登录浏览公开内容

- **WHEN** 未登录用户访问帖子列表或详情
- **THEN** 系统 SHALL 正常展示内容，不强制登录

#### Scenario: 未登录触发受保护操作

- **WHEN** 未登录用户尝试发布/点赞/收藏/评论或进入个人中心
- **THEN** 系统 SHALL 引导用户先完成登录再继续该操作

```
