# Implementation Tasks — miniprogram-foundation

## 1. 工程脚手架（app-scaffold）

- [x] 1.1 用 Taro 4 + React + TypeScript 初始化小程序工程，bun 作为包管理器（`bun install` 通过）
- [x] 1.2 配置微信 appid `wx555c14bc9d837e27`（`project.config.json` / Taro 编译配置）
- [x] 1.3 建立目录结构：`src/pages`、`src/components`、`src/store`、`src/services`、`src/types`、`src/styles`、`config/`
- [x] 1.4 配置多环境（dev/prod）可切换 baseURL，dev 默认 `http://localhost:3000/api/v1`
- [x] 1.5 搭建 TabBar 与路由骨架：首页、发布、个人中心三个主入口 + 占位页面
- [x] 1.6 编写 bun 脚本（dev/build 微信端）并验证可编译出微信开发者工具可加载的产物

## 2. 设计系统（design-system）

- [x] 2.1 集成 weapp-tailwindcss + tailwindcss，跑通最小样式闭环（原子类在小程序端正确渲染）
- [x] 2.2 用 ui-ux-pro-max skill 产出设计方向与设计 token（配色/字号/间距/圆角/阴影），落为可复用变量与 Tailwind 主题配置
- [x] 2.3 实现基础 UI 组件：按钮、卡片、头像、标签（Tag/话题）、Toast/反馈
- [x] 2.4 实现加载态骨架屏组件与列表骨架
- [x] 2.5 实现动效/转场原语：页面/元素进场过渡、按压反馈（优先 transform/opacity 等小程序友好属性）
- [x] 2.6 建立组件预览/展示页，验证 token 与组件在真机/模拟器的视觉与动效

## 3. 数据访问层（data-access）

- [x] 3.1 基于 `Taro.request` 封装 HTTP 客户端：baseURL 拼接、通用请求头、统一响应解包、规范化错误
- [x] 3.2 实现 JWT 注入拦截：受保护请求自动附加 `Authorization: Bearer <jwt>`
- [x] 3.3 实现 401 处理：清除本地登录态并触发重新登录流程
- [x] 3.4 建立 Zustand 全局 store：用户/鉴权态（token、用户信息、登录状态）
- [x] 3.5 编写 go-service `/api/v1` 接口契约的 TypeScript 类型（User/Post/PostImage/Topic/Comment/Like/Favorite/分页/鉴权响应）
- [x] 3.6 封装各接口的 service 方法签名（auth/users/posts/interactions/upload），供后续 change 复用

## 4. 微信登录鉴权（wechat-auth）

- [x] 4.1 实现 `wx.login` 取 code → `POST /auth/wechat/login` 换 JWT 的登录流程
- [x] 4.2 登录成功后写入 Zustand 登录态并持久化 token 与用户信息到本地存储
- [x] 4.3 小程序启动时从本地存储恢复登录态（token 未失效时自动登录）
- [x] 4.4 实现登录态守卫与未登录浏览兜底：公开内容可浏览，受保护操作引导登录
- [x] 4.5 处理登录失败与 401 失效场景的用户提示与状态清理

## 5. 联通与验证

- [ ] 5.1 用真实接口契约打通一次可运行调用链（列表类公开接口）验证请求层解包与错误处理
- [ ] 5.2 校验设计系统在小程序端的动效表现符合「富动效、设计感」预期
- [ ] 5.3 整理 README：工程说明、bun 脚本、环境切换、目录约定，供后续特性 change 参考
