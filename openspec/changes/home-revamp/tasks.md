# Implementation Tasks — home-revamp（首页改版 + 发布分类 + 个人中心图标化）

## 0. 后端小修订（category=none 过滤，前置）

- [x] 0.1 go-service `applyFilters`：category=="none" → `WHERE (category = '' OR category IS NULL)`
- [x] 0.2 go-service 补测试 + go build/test 通过
- [x] 0.3 后端提交（单独 commit，不新建 openspec change，属 change① 小修订）

## 1. Iconfont 体系（可持续更新）

- [x] 1.1 `scripts/gen-icons.mjs`：读 iconfont.json 链接 → fetch symbol JS → 解析全部 symbol → 生成 icons.ts
- [x] 1.2 `src/components/Iconfont/icons.ts`：生成物（name → {viewBox, path}）+ IconName 类型
- [x] 1.3 `src/components/Iconfont/index.tsx`：运行时拼 svg base64 + color 染色
- [x] 1.4 weapp 兼容验证（base64 data-uri 渲染）
- [x] 1.5 清理无用的 taro-iconfont-cli 依赖
- [x] 1.6 导出到 components/index.ts

## 2. 类型与 service 扩展

- [x] 2.1 `types/api.ts`：Post 加 `category?: string`；新增 `CategoryInfo{value,label}`
- [x] 2.2 `services/api/posts.ts`：findAll 扩展 `{page,limit,keyword,category,sort,following}` 参数
- [x] 2.3 新增 `categoriesApi.list()` → GET /categories
- [x] 2.4 `CreatePostBody`/`UpdatePostBody` 加 `category`

## 3. SearchBar 组件

- [x] 3.1 `src/components/SearchBar/index.tsx`：搜索输入框（Iconfont sousuo）+ 右侧圆形加号（Iconfont jiahao）
- [x] 3.2 点击搜索/确认触发 onSearch(keyword)；加号 onAdd → navigateTo publish
- [x] 3.3 清空搜索恢复

## 4. CategoryTabs 组件

- [x] 4.1 `src/components/CategoryTabs/index.tsx`：横滑 ScrollView 胶囊 tab
- [x] 4.2 tab 列表：关注（登录才有）/推荐/5分类/其他；选中态奶橘
- [x] 4.3 tab → 查询参数映射（following/sort=likes/category/none）
- [x] 4.4 onChange(tab) 回调

## 5. 首页重构

- [x] 5.1 `pages/index/index.tsx`：去"摆烂随笔"标题+描述
- [x] 5.2 顶部 SearchBar + CategoryTabs
- [x] 5.3 分类拉取：categoriesApi.list 组装 tab（关注+推荐+分类+其他）
- [x] 5.4 usePagedList fetcher 按当前 tab/keyword 构建，切换 reload
- [x] 5.5 搜索态覆盖分类；清搜索恢复 tab
- [x] 5.6 未登录隐藏关注 tab

## 6. TabBar 三 tab

- [x] 6.1 `app.config.ts`：去掉 publish tab，list 为 首页/消息/我的
- [x] 6.2 确认 publish 页仍注册（从加号进入）

## 7. 发布页分类单选

- [x] 7.1 `src/components/CategoryPicker/index.tsx`：拉 categoriesApi.list，横向单选（可不选=其他）
- [x] 7.2 `pages/publish/index.tsx`：接入 CategoryPicker，state 存 category
- [x] 7.3 提交 create/update 带 category
- [x] 7.4 编辑帖子回填 category

## 8. 个人中心图标化

- [x] 8.1 `pages/profile/index.tsx`：编辑按钮 Iconfont bianji，设置 Iconfont quanjushezhi
- [x] 8.2 并排右上角，替换文字 pill；点击行为不变

## 9. 验证

- [x] 9.1 tsc 类型检查通过
- [x] 9.2 weapp 编译通过
- [x] 9.3 真机冒烟：搜索、分类切换、发布分类、加号入口、三 tab、个人中心图标
