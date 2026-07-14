---
comet_change: home-revamp
role: technical-design
canonical_spec: openspec
archived-with: 2026-07-14-home-revamp
status: final
---

# 首页改版 + 发布分类 + 个人中心图标化 Design Doc

## 架构

```
┌─────────────────────────────────────────────────┐
│  首页 pages/index                                │
│  ┌─────────────────────────────────────────┐   │
│  │ SearchBar  [🔍 搜索框........] [＋]        │   │
│  ├─────────────────────────────────────────┤   │
│  │ CategoryTabs 关注|推荐|故事|日常|技术|...  │   │  横滑
│  ├─────────────────────────────────────────┤   │
│  │ PostCard 列表（usePagedList，按 tab 请求）│   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
        │ 加号                    │ tab 切换
        ▼                        ▼
  发布页 pages/publish      postsApi.findAll({category/sort/following})
  + CategoryPicker

TabBar: 首页 | 消息 | 我的（去掉发布）

Iconfont 体系：
  scripts/gen-icons.mjs → icons.ts（数据）→ Iconfont 组件（运行时染色）
```

## Iconfont 体系（可持续更新）

三层解耦，用户频繁更新图标只需跑一次脚本：

### scripts/gen-icons.mjs
- 读 `iconfont.json` 的 symbol_url
- fetch symbol JS → 正则解析所有 `<symbol id viewBox>path</symbol>`
- 生成 `src/components/Iconfont/icons.ts`：`export const ICONS = { bianji: {viewBox, path}, ... }`
- trim `icon-` 前缀
- 用户更新流程：iconfont.cn 改图标 → `node scripts/gen-icons.mjs` → 全量刷新

### src/components/Iconfont/icons.ts（生成物）
```ts
export const ICONS: Record<string, {viewBox: string; path: string}> = { ... }
export type IconName = keyof typeof ICONS
```

### src/components/Iconfont/index.tsx
```tsx
<Iconfont name="bianji" size={20} color="var(--c-peach)" />
```
- 运行时拼完整 svg 字符串（注入 fill=color）→ base64 → View background-image 或 Image src
- color 默认 currentColor / 主题色
- weapp 用 base64 data-uri（内联 svg 不被支持）

## 组件设计

| 组件 | props | 职责 |
|------|-------|------|
| Iconfont | name/size/color | 单色图标渲染，运行时染色 |
| SearchBar | value/onSearch/onAdd | 搜索框（Iconfont sousuo）+ 加号（Iconfont jiahao） |
| CategoryTabs | tabs/active/onChange | 横滑胶囊 tab，选中态奶橘 |
| CategoryPicker | value/onChange | 发布页分类单选（拉 categoriesApi） |

## 数据流（首页）

follow-list 成熟模式（避免 usePagedList 闭包坑）：

```tsx
const [activeTab, setActiveTab] = useState('recommend')  // 默认推荐
const [keyword, setKeyword] = useState('')

// tab → query 映射
function tabToQuery(tab): FindAllParams {
  if (keyword) return { keyword }              // 搜索优先
  switch (tab) {
    case 'following': return { following: true }
    case 'recommend': return { sort: 'likes' }
    case 'other': return { category: 'none' }
    default: return { category: tab }          // story/daily/...
  }
}

const fetcher = useCallback(
  (page) => postsApi.findAll({ page, ...tabToQuery(activeTab) }),
  [activeTab, keyword],
)
const { list, ... , reload } = usePagedList(fetcher)

useEffect(() => { reload() }, [activeTab, keyword])  // 切换显式 reload
```

- tab 列表组装：`[关注(登录才有), 推荐, ...categoriesApi.list(), 其他]`
- 未登录隐藏关注；默认选中推荐
- 搜索：输入 keyword → 覆盖分类查询；清空 → 恢复 activeTab

## service / types 扩展

```ts
// types/api.ts
interface Post { ...; category?: string }
interface CategoryInfo { value: string; label: string }

// services/api/posts.ts
findAll(params: { page?, limit?, keyword?, category?, sort?, following? })
// services/api/categories.ts（或并入 posts）
categoriesApi.list(): Promise<CategoryInfo[]>  // GET /categories

// CreatePostBody / UpdatePostBody 加 category
```

## 后端小修订（Task 0，前置）

`go-service internal/posts/service.go applyFilters`:
```go
if opts.Category == "none" {
    q = q.Where("category = '' OR category IS NULL")
} else if opts.Category != "" {
    q = q.Where("category = ?", opts.Category)
}
```
单独 commit 到后端 main，属 change① 补充，不新建 openspec change。

## 页面改造

- **首页**：删标题/描述块，加 SearchBar + CategoryTabs，fetcher 按 tab
- **发布页**：接入 CategoryPicker，state 存 category，提交带 category，编辑回填
- **个人中心**：编辑→Iconfont bianji，设置→Iconfont quanjushezhi，并排右上角
- **app.config.ts**：tabBar 去 publish，三 tab

## 测试策略

- tsc + weapp 编译
- 纯逻辑单测：tabToQuery 映射、Iconfont svg 拼接/base64
- 真机冒烟：搜索、分类切换、发布分类、加号、三 tab、图标渲染

## 边界与限制

- 图标只渲染单色（多色图标不支持运行时染色）
- 搜索仅 title（后端能力）
- "其他"= category 空，依赖后端 category=none 修订
- weapp svg base64 兼容性 build 时验证
- 清理无用的 taro-iconfont-cli 依赖

