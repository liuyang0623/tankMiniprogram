## Context

后端 change① 已提供：`GET /categories`（固定 5 分类）、`GET /posts` 扩展 keyword/category/sort=likes/following 查询。前端现有可复用件：`usePagedList`（泛型分页 hook）、`PageLayout`（主题容器）、`PostCard`、`SkeletonList`、`useAuthStore`（登录态）、`postsApi.findAll`。iconfont 项目 font_5210227_nh41ti6xt8.js 提供 13 个单色图标。

现状要点：
- 首页 `pages/index` 现为纯信息流（标题 + usePagedList(findAll)），需重构为搜索 + 分类 tab
- 发布页 `pages/publish` 用 topicInput 自由话题，需加分类单选（与话题共存）
- 个人中心 `pages/profile` 编辑/设置是文字 pill 按钮，需图标化
- tabBar 现为 首页/发布/我的，去掉发布变 首页/消息/我的
- taro-iconfont-cli 在 bun 环境跑不通（多处 __importDefault().sync 崩），改手写组件

## Goals / Non-Goals

**Goals:**
- 首页搜索框（点击搜索，按 title）+ 加号发布入口
- 分类 tab 横滑（关注/推荐/5分类/其他），切换重新请求
- tabBar 三 tab
- 发布页分类单选
- 个人中心图标化
- 手写 Iconfont 组件接入单色图标

**Non-Goals:**
- 不改后端（change① 已足）
- 不做搜索历史/热门搜索
- 不改自由 #话题机制
- 不做分类的无限滚动预加载
- 不引入图标库（手写组件）

## Decisions

### D1. 手写 Iconfont 组件
- 从 iconfont symbol JS 提取需要的单色 path，内联为组件 map
- `<Iconfont name="bianji" size={20} color="var(--c-peach)" />`
- 用 SVG + Image base64 或 Taro 内联渲染，fill 用 currentColor/传入色
- 只提取本次用到的图标（bianji/quanjushezhi/sousuo/jiahao 等），避免全量

### D2. 首页重构
- 顶部 SearchBar：搜索输入框（点击/确认触发）+ 右侧圆形加号（navigateTo publish）
- CategoryTabs：横滑 ScrollView，胶囊 tab，选中态奶橘
- tab → 查询参数映射：
  - 关注 → `following=true`（未登录隐藏）
  - 推荐 → `sort=likes`
  - 故事/日常/技术/美食/旅游 → `category=xxx`
  - 其他 → 无 category 的文章（前端特殊处理或后端 category=空）
- 搜索态：输入 keyword 后覆盖分类，展示搜索结果
- usePagedList 按当前 tab/keyword 构建 fetcher，切换 reload

### D3. TabBar 三 tab
- app.config.ts 去掉 publish，list 为 首页/消息/我的
- 发布入口移到首页加号

### D4. 发布页分类单选
- CategoryPicker 组件：拉 GET /categories，横向单选（可不选=其他）
- 提交时 create/update 带 category
- 编辑已有帖子时回填当前 category

### D5. 个人中心图标化
- 编辑按钮 Iconfont bianji，设置按钮 Iconfont quanjushezhi
- 并排放个人卡片右上角，替换现有文字 pill

### D6. "其他"tab = 后端 category=none 过滤
- 后端 `GET /posts?category=none`（或空 sentinel）返回 category 为空的文章
- 前端"其他"tab 传该参数
- 后端小改：applyFilters 中 category=="none" → `WHERE (category = '' OR category IS NULL)`
- 这是 change① 的一个小修订，在本 change build 前先补后端

## Risks / Open Questions

- 搜索与分类互斥：搜索时忽略分类 tab，清搜索恢复当前 tab
- Iconfont 组件渲染方式（Image base64 vs 内联 SVG）build 时验证 weapp 兼容性
