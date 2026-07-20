# 摆烂随笔 · 微信小程序

一个温柔治愈系的博客/随笔交流小程序。appid `wx555c14bc9d837e27`。

## 技术栈

- **框架**：Taro 4 + React 18 + TypeScript
- **包管理**：bun（仓库同时保留 `package-lock.json`，npm/npx 亦可）
- **样式**：weapp-tailwindcss + Tailwind（自绘设计系统）
- **状态**：Zustand
- **请求**：基于 `Taro.request` 的自封装 HTTP 客户端（三层：request / authRequest / optionalAuthRequest）
- **测试**：vitest
- **流程**：comet + OpenSpec 管理需求到归档全流程（AI 协作铁律见 [AGENT.md](./AGENT.md)）
- **后端**：tankService（`/api/v1`，Go+Gin+GORM+MySQL，JWT + 微信登录）

## 脚本

```bash
bun install            # 安装依赖
bun run dev:weapp      # 开发（watch 编译微信端，连本地后端）
bun run dev:weapp:prod # 开发（watch 编译微信端，连线上后端）
bun run build:weapp    # 构建微信端产物到 dist/
bun run test           # 运行单元测试
bun run tsc            # 类型检查
```

编译后用微信开发者工具打开项目根目录（`miniprogramRoot` 指向 `dist/`）预览。

### 代码生成脚本（改了源必须重跑，产物入 git）

```bash
node scripts/gen-icons.mjs         # iconfont symbol JS → src/components/Iconfont/icons.ts
node scripts/gen-tabbar-icons.mjs  # icons.ts → src/assets/tabbar/*.png（依赖 ImageMagick）
```

- 更新图标：改 `iconfont.json` 的 `symbol_url` 后重跑 `gen-icons.mjs`；用 `<Iconfont name='...' />` 渲染（svg data-uri，颜色需传具体 hex）。
- tabBar 图标只支持本地 PNG，由 `gen-tabbar-icons.mjs` 从 `icons.ts` 生成两套配色。

## 环境切换

后端地址在 `src/config/env.ts`，按编译期 `TARO_APP_ENV` 切换：

- `dev`（默认）：`http://localhost:3000/api/v1`
- `prod`：`https://tank.dayangge.site/api/v1`

```bash
# 本地开发连线上后端（watch 编译，方便真机/开发者工具调试线上环境）
bun run dev:weapp:prod

# 构建线上产物
TARO_APP_ENV=prod bun run build:weapp
```

## 目录约定

```
config/            # Taro 编译配置 + env.ts（可切换 baseURL）
scripts/           # gen-icons.mjs / gen-tabbar-icons.mjs（代码生成）
src/
  app.config.ts    # 全局路由 + TabBar（首页/日记/消息/我的）
  app.tsx          # 启动恢复登录态 + 全局 Toast
  pages/           # index(信息流) detail(帖子详情) publish(发布) messages/chat(私信)
                   # profile/profile-edit(个人中心) drafts(草稿) follow-list(关注/粉丝)
                   # user-profile(他人主页) diary(日记：index/edit/detail)
  components/       # 设计系统 + 业务组件：Button/Card/Avatar/Tag/Skeleton/Toast/Transition
                   # PostCard/CommentList/RichEditor/Iconfont/PageLayout/SettingsDrawer
                   # CustomNavBar/DiaryCard/NotebookDrawer/FollowButton 等
  store/           # Zustand：auth(登录态) ui(Toast/loading) theme(亮暗) follow(关注计数)
                   # message(会话) ws(WebSocket)
  services/
    request.ts             # HTTP 客户端（baseURL/JWT/解包/401）
    authRequest.ts         # 受保护请求（注入 token + 统一 401 清态+提示）
    optionalAuthRequest.ts # 可选登录请求（OptionalJWT 路由）
    auth.ts                # 微信静默登录流程（login/logout）
    errors.ts              # ApiError 规范化错误
    message.ts             # 私信消息服务
    api/                   # 各模块 API：auth/users/posts/interactions/upload/diary
  hooks/           # usePagedList(分页) useAuthGuard(互动登录守卫)
                   # useOptimisticToggle(乐观更新) useDraftAutosave(草稿自存)
  utils/           # navbar(自绘导航栏几何) tabbar(原生导航/tabBar 配色) theme 等
  types/           # tankService 接口契约类型（api.ts / diary.ts）
  assets/          # tabbar 图标 PNG / diary-decor 装饰插画
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

- **公开接口**（帖子列表/详情）：匿名可访问，走 `optionalAuthRequest`（登录则带 token 个性化返回）。
- **受保护接口**（发布/互动/个人中心/日记）：`Authorization: Bearer <jwt>`，走 `authRequest`。
- **登录**：微信静默登录（`Taro.login` 换 JWT，见 `services/auth.ts`），无独立登录页；页面用 `isLogin` 判断 + 引导登录（参考 `pages/messages`、`pages/diary` 的未登录分支）。互动场景（评论/点赞）用 `useAuthGuard` 守卫。
- **401 统一处理**：收敛在 `authRequest` 的 `onUnauthorized`——清登录态 + 全局 toast「登录已失效，请重新登录」。调用方无需各自处理；已登出则跳过，配合 toast 去重避免并发 401 叠弹窗。
- token 由 `wx.login` 换取并持久化，启动自动恢复。

## 功能模块

已落地的主要特性（均复用统一的设计系统、请求层与鉴权）：

- **信息流与详情**：首页分类信息流、帖子详情、评论、点赞/收藏互动
- **发布**：富文本发布（微信 editor）+ 草稿箱 + 话题分类 + 图片上传
- **个人中心**：资料展示/编辑、我的帖子、我的收藏、设置抽屉（主题切换/草稿/退出）
- **社交**：关注/粉丝列表、他人主页、私信会话（WebSocket）
- **系统通知**：关注他人时给对方写站内通知；消息页顶部固定"系统通知"聚合入口（未读红点 + 最新摘要），独立详情页整体已读、关注者可点跳主页（类型可扩展，预留 like/comment）
- **日记**：多日记本、自定义导航栏切换、日记时间线、写/看日记

> 注：登录换 JWT 与真实列表数据需 tankService 启动后端到端联调；请求层与错误处理已按真实契约实现并有单测覆盖，离线可验证分支逻辑。
