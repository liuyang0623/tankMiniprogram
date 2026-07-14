## Why

后端 change① post-category-search 已上线，提供了分类列表、按分类/关键词/排序/关注筛选文章的能力。现在改造前端首页为"搜索 + 分类 tab"的内容中心，并把发布入口从 tabBar 移到首页，发布页支持分类单选，同时把个人中心的编辑/设置按钮图标化。

用户已确认的设计决策：
- 首页去掉"摆烂随笔"标题和描述，顶部改为搜索框（点击搜索，按 title 查）+ 右侧圆形加号（发布入口）
- 搜索框下方为分类 tab 横滑（胶囊样式），顺序：关注 | 推荐 | 故事 | 日常 | 技术 | 美食 | 旅游 | 其他
- 未登录隐藏"关注"tab；切换 tab 重新请求对应列表
- tabBar 去掉"发布"，变三 tab（首页/消息/我的）
- 发布页新增分类单选（故事/日常/技术/美食/旅游，从 GET /categories 拉取）
- 个人中心编辑/设置改用 iconfont 单色图标，并排右上角
- 图标用手写轻量 Iconfont 组件（taro-iconfont-cli 与 bun 环境不兼容），单色可染色

## What Changes

- **首页 `pages/index`**：去标题/描述；顶部 SearchBar（搜索框 + 加号）；分类 tab 横滑；按 tab 切换请求（category/sort=likes/following）
- **TabBar**：`app.config.ts` 去掉发布 tab，改三 tab（首页/消息/我的）
- **发布页 `pages/publish`**：新增分类单选组件，拉 GET /categories，提交带 category
- **个人中心 `pages/profile`**：编辑/设置按钮改 Iconfont 图标并排右上角
- **他人主页 `pages/user-profile`**：帖子流不受影响（可选：作者卡片沿用）
- **新增组件**：`Iconfont`（手写单色图标组件）、`SearchBar`、`CategoryTabs`、`CategoryPicker`
- **service/types**：postsApi.findAll 扩展查询参数；新增 categoriesApi.list；CreatePostBody 加 category；类型加 Category

## Capabilities

### New Capabilities
- `home-content-hub`: 首页内容中心——搜索、分类 tab 切换、发布入口
- `post-category-ui`: 前端分类能力——发布分类单选、分类筛选展示

### Modified Capabilities
<!-- 无既有 spec 需要变更 -->

## Impact

- **修改文件**：
  - `src/pages/index/index.tsx`：首页重构
  - `src/pages/publish/index.tsx`：分类单选
  - `src/pages/profile/index.tsx`：图标化
  - `src/app.config.ts`：三 tab
  - `src/services/api/posts.ts`：findAll 查询扩展 + categoriesApi
  - `src/types/api.ts`：Post 加 category、CategoryInfo 类型
- **新增文件**：
  - `src/components/Iconfont/`：手写单色图标组件（从 iconfont symbol 提取 SVG path）
  - `src/components/SearchBar/`、`src/components/CategoryTabs/`、`src/components/CategoryPicker/`
- **依赖后端**：GET /categories、GET /posts?keyword/category/sort/following（change① 已提供）
- **图标**：iconfont 项目 font_5210227_nh41ti6xt8.js，单色可染色（bianji/quanjushezhi/sousuo/jiahao 等）
- **虚拟分类**：关注/推荐/其他不是真实 category，前端映射为 following=true / sort=likes / 无 category 特殊处理
