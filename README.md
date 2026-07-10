# 摆烂随笔 · 微信小程序

一个温柔治愈系的博客/随笔交流小程序。appid `wx555c14bc9d837e27`。

## 技术栈

- **框架**：Taro 4 + React 18 + TypeScript
- **包管理**：bun
- **样式**：weapp-tailwindcss + Tailwind（自绘设计系统）
- **状态**：Zustand
- **请求**：基于 `Taro.request` 的自封装 HTTP 客户端
- **测试**：vitest
- **后端**：go-service（`/api/v1`，Go+Gin+GORM+MySQL，JWT + 微信登录）

## bun 脚本

```bash
bun install            # 安装依赖
bun run dev:weapp      # 开发（watch 编译微信端）
bun run build:weapp    # 构建微信端产物到 dist/
bun run test           # 运行单元测试
bun run tsc            # 类型检查
```

编译后用微信开发者工具打开项目根目录（`miniprogramRoot` 指向 `dist/`）预览。

## 环境切换

后端地址在 `config/env.ts`，按编译期 `TARO_APP_ENV` 切换：

- `dev`（默认）：`http://localhost:3000/api/v1`
- `prod`：上线时替换为真实域名

```bash
TARO_APP_ENV=prod bun run build:weapp
```

## 目录约定

```
config/            # Taro 编译配置 + env.ts（可切换 baseURL）
src/
  app.config.ts    # 全局路由 + TabBar（首页/发布/我的）
  app.tsx          # 启动恢复登录态 + 全局 Toast
  pages/           # index(信息流) / publish(占位) / profile(占位)
  components/       # 设计系统：Button/Card/Avatar/Tag/Skeleton/Transition/Toast
  store/           # Zustand：auth（登录态）/ ui（Toast/loading）
  services/
    request.ts     # HTTP 客户端（baseURL/JWT/解包/401）
    authRequest.ts # 受保护请求封装（注入 token + 401 清态）
    auth.ts        # 微信登录流程
    api/           # 各模块 API 方法（auth/users/posts/interactions/upload）
  hooks/           # useAuthGuard（登录守卫）
  types/api.ts     # go-service 接口契约类型
  styles/          # tokens.scss + motion.scss
```

## 设计系统

温柔治愈系。设计 token 在 `tailwind.config.js`：

| 用途 | 类名 | 值 |
|------|------|-----|
| 页面背景 | `bg-bg` | `#FAF6F0` 奶油米白 |
| 主强调 | `bg-peach` / `text-peach` | `#F0A868` 奶橘 |
| 次强调 | `taro` | `#E4A9BE` 藕粉 |
| 点缀 | `haze` | `#A6C0CE` 雾霾蓝 |
| 主文字 | `text-ink` | `#4A413A` 深棕灰 |
| 次文字 | `text-ink-sub` | `#8A7F76` |
| 卡片圆角 | `rounded-card` | `24rpx` |
| 柔和阴影 | `shadow-soft` | `0 8rpx 24rpx rgba(74,65,58,.08)` |

动效原语（`src/styles/motion.scss`）：`anim-in`（淡入上浮）、`anim-float`（浮动）、`press`（按压反馈）、`shimmer`（骨架屏）。仅用 transform/opacity，小程序性能友好。

## 鉴权模型

- **公开接口**（帖子列表/详情）：匿名可访问
- **受保护接口**（发布/互动/个人中心）：`Authorization: Bearer <jwt>`，未登录时 `useAuthGuard` 引导登录
- token 由 `wx.login` 换取并持久化，启动自动恢复；401 自动清态重登

## 后续开发

本工程是地基层（`miniprogram-foundation`）。后续特性 change 复用此处的设计系统、请求层与鉴权：

- `article-feed-and-detail`：信息流 + 详情 + 互动
- `article-publish-richtext`：富文本发布（微信 editor）+ 草稿 + 话题 + 上传
- `user-profile-center`：个人中心 + 资料 + 我的帖子 + 收藏

> 注：登录换 JWT 与真实列表数据需 go-service 启动后端到端联调；请求层与错误处理已按真实契约实现并有单测覆盖，离线可验证分支逻辑。
