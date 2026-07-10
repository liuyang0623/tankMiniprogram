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
