---
comet_change: diary-frontend
role: technical-design
canonical_spec: openspec
status: final
archived-with: 2026-07-15-diary-frontend
status: final
---

# 日记前端（Moo 风格）Design Doc

## 选题与范围

移植 Moo 日记的前端体验，第一期：日记本 + 大图手帐卡横滑 + 富文本编辑 + 心情天气。跨两仓库，拆两个 change，**先后端 A2 后前端 B**：

- **Change A2（go-service）`diary-notebook`**：notebook 表 + diary 加 notebook_id + notebook CRUD + 登录自动建默认本 + `GET /diaries?notebookId=` 过滤
- **Change B（本 change）`diary-frontend`**：前端页面/组件/服务，依赖 A2 接口

本 Design Doc 聚焦前端 Change B（A2 由后端 change 自己的产物覆盖，此处只列契约依赖）。

## 架构

```
tabBar: 首页 | 日记 | 消息 | 我的

pages/diary/index（列表页）
 ├─ 自定义 header（PageLayout 自定义导航栏）
 │   └─ 点击 → NotebookDrawer 抽屉（切换/新建/管理日记本）
 ├─ Swiper 横滑（一屏一张 DiaryCard 大图手帐卡）
 │   └─ 页码点 + 空态提示
 └─ 悬浮"写日记"加号 → pages/diary/edit

pages/diary/edit（编辑页）
 ├─ 归属 notebook 选择
 ├─ 标题 input
 ├─ MoodWeatherPicker（心情 5 + 天气 5 单选）
 ├─ RichEditor（复用）+ 图片 uploadApi（复用）
 └─ 保存 → diaryApi.create / update

pages/diary/detail（详情页）
 ├─ 封面大图 + 标题 + 心情天气 + 日期
 ├─ RichText 正文
 └─ 编辑 → edit；删除 → 确认 → diaryApi.remove
```

## 组件设计

| 组件 | props | 职责 |
|------|-------|------|
| NotebookDrawer | notebooks/activeId/onSelect/onCreate/onManage | 向下抽屉，日记本列表 + 新建 + 管理 |
| DiaryCard | diary/notebookColor/onTap | 大图手帐卡：封面铺满 + 底部渐变叠标题/心情/天气/日期；无封面用 color 兜底 |
| MoodWeatherPicker | mood/weather/onChange | 两排 emoji 单选，选中态奶橘描边 |

## 数据流（列表页，follow-list 成熟模式避闭包坑）

```tsx
const [notebooks, setNotebooks] = useState<Notebook[]>([])
const [activeNb, setActiveNb] = useState<number>()
const [diaries, setDiaries] = useState<DiaryListItem[]>([])
const [drawerOpen, setDrawerOpen] = useState(false)

// 进页面：notebookApi.list() → 选第一个 → 拉该本日记
// 切日记本：setActiveNb(id) → useEffect([activeNb]) 重新拉 diaries
// 新建日记本：notebookApi.create → 刷新列表 → 自动切到新本
useEffect(() => {
  if (activeNb == null) return
  diaryApi.list({ notebookId: activeNb }).then(r => setDiaries(r.data))
}, [activeNb])
```

- 用 `useDidShow` 在编辑/详情返回后刷新当前本（新增/改/删同步）
- Swiper current 变化：第一期一次拉够（分页留第二期）

## 类型（types/diary.ts）

```ts
export interface Notebook {
  id: number
  name: string
  color: string   // 封面色/兜底色
  cover?: string   // 日记本封面图
  diaryCount?: number
  createdAt: string
}
export interface Diary {
  id: number
  notebookId: number
  title: string
  content: string   // HTML
  cover: string
  mood: string      // key，如 "happy"
  weather: string   // key，如 "sunny"
  images?: { id: number; url: string; order: number }[]
  createdAt: string
  updatedAt: string
}
export interface DiaryListItem {
  id: number; notebookId: number; title: string
  contentPreview: string; cover: string; mood: string; weather: string; createdAt: string
}
export type CreateDiaryBody = { notebookId: number; title: string; content: string; cover?: string; mood?: string; weather?: string; images?: string[] }
export type UpdateDiaryBody = Partial<CreateDiaryBody>
export type CreateNotebookBody = { name: string; color: string; cover?: string }
export type UpdateNotebookBody = Partial<CreateNotebookBody>

// 常量表（key ↔ emoji ↔ label）
export const MOODS = [
  { key: 'happy', emoji: '😊', label: '开心' },
  { key: 'calm',  emoji: '😐', label: '平静' },
  { key: 'sad',   emoji: '😢', label: '难过' },
  { key: 'tired', emoji: '😴', label: '疲惫' },
  { key: 'love',  emoji: '🥰', label: '幸福' },
]
export const WEATHERS = [
  { key: 'sunny',   emoji: '☀️', label: '晴' },
  { key: 'cloudy',  emoji: '⛅', label: '多云' },
  { key: 'rainy',   emoji: '🌧', label: '雨' },
  { key: 'snowy',   emoji: '❄️', label: '雪' },
  { key: 'rainbow', emoji: '🌈', label: '彩虹' },
]
```

## API（services/api/diary.ts）

依赖后端 Change A2 契约：
```ts
export const notebookApi = {
  list:   () => authRequest<Notebook[]>({ url: '/notebooks' }),
  create: (b: CreateNotebookBody) => authRequest<Notebook>({ url: '/notebooks', method: 'POST', data: b }),
  update: (id, b: UpdateNotebookBody) => authRequest<Notebook>({ url: `/notebooks/${id}`, method: 'PATCH', data: b }),
  remove: (id) => authRequest<void>({ url: `/notebooks/${id}`, method: 'DELETE' }),
}
export const diaryApi = {
  list:   (p: { notebookId: number; page?: number }) => authRequest<Paginated<DiaryListItem>>({ url: `/diaries?notebookId=${p.notebookId}&page=${p.page ?? 1}` }),
  detail: (id) => authRequest<Diary>({ url: `/diaries/${id}` }),
  create: (b: CreateDiaryBody) => authRequest<Diary>({ url: '/diaries', method: 'POST', data: b }),
  update: (id, b: UpdateDiaryBody) => authRequest<Diary>({ url: `/diaries/${id}`, method: 'PATCH', data: b }),
  remove: (id) => authRequest<void>({ url: `/diaries/${id}`, method: 'DELETE' }),
}
```

## UI 复刻要点（Moo 风格）

- 大图手帐卡：圆角、封面铺满、底部线性渐变遮罩（透明→深）叠白字标题/心情天气/日期
- 无封面：notebook.color 做柔和渐变背景 + 居中标题
- 配色沿用主题 token（奶橘 #f0a868 主色、米白 #faf6f0 背景、墨色 #4a413a 文字）
- 抽屉：顶部滑下、半透明遮罩、日记本 color 圆点 + 名字 + 篇数 + 选中勾
- 页码点：Swiper 下方居中小圆点

## tabBar 图标

沿用成熟方案（[[taro-native-component-theming]] / gen-tabbar-icons）：iconfont 取日记本图标 → ImageMagick 生成 81×81 PNG（灰 #8A7F76 / 奶橘 #F0A868），放 assets/tabbar/diary(-active).png。

## 测试策略

- tsc + weapp 编译
- 纯逻辑单测：mood/weather key↔emoji 映射、notebook 切换 query 构造、无封面兜底判定
- 真机冒烟：抽屉切/建/改/删日记本、横滑翻日记、写日记（心情天气图片）、详情编辑删除、四 tab

## 边界与限制

- 富文本一屏卡片只显示封面+标题，全文在详情
- 依赖后端 Change A2 先上线（notebook 接口）
- 大图卡无封面用 color 兜底
- 分页/统计/密码锁/导出留第二期
- weapp Swiper 大图性能 build 时验证

