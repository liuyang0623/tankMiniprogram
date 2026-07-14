## Context

前端现有：Iconfont 体系（icons.ts 含 shouye/xiaoxi_o/gerentouxiang_o 等 13 单色图标 + scripts/gen-icons.mjs）、messages 页有私有 formatTime（会话列表用）、PostCard/详情/CommentItem 均未显示时间。tabBar 三 tab 纯文字。沙盒有 ImageMagick（magick 命令）。

现状要点：
- 小程序 tabBar `iconPath`/`selectedIconPath` 只接受**本地 PNG**（不支持 svg/字体/网络图），尺寸建议 81×81px
- Post 有 publishedAt?/createdAt，Comment 有 createdAt（后端已返回 ISO 字符串）
- messages 页 formatTime 是会话专用格式（HH:mm/昨天/月日），与本次「相对时间」不同语义，保持独立或改造

## Goals / Non-Goals

**Goals:**
- tabBar 三 tab 加图标（本地 PNG，选中奶橘/未选灰）
- 相对时间工具 formatRelativeTime
- PostCard/详情/CommentItem 显示相对时间

**Non-Goals:**
- 不改后端
- 不做时间的 tooltip/绝对时间悬浮
- 不改 messages 会话列表的时间格式（语义不同）
- 不引入运行时图片处理库（PNG 编译期生成）

## Decisions

### D1. tabBar PNG 生成脚本
- `scripts/gen-tabbar-icons.mjs`：从 icons.ts 提取 shouye/xiaoxi_o/gerentouxiang_o 的 viewBox+paths
- 拼 svg（注入 fill）→ 写临时 svg → `magick -background none in.svg out.png` 转 81×81
- 每图标 2 套色：未选 #8A7F76、选中 #F0A868
- 输出到 `src/assets/tabbar/`：home.png/home-active.png/message.png/message-active.png/profile.png/profile-active.png
- 一次性生成，产物入 git（tabBar 图标不常变，不需每次构建跑）

### D2. app.config.ts tabBar 加图标
```ts
{ pagePath: 'pages/index/index', text: '首页',
  iconPath: 'assets/tabbar/home.png',
  selectedIconPath: 'assets/tabbar/home-active.png' }
```
- 三 tab 各配 iconPath/selectedIconPath

### D3. 相对时间工具 src/utils/time.ts
```ts
export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return '刚刚'
  if (diff < 3600_000) return `${Math.floor(diff/60_000)}分钟前`
  if (diff < 86400_000) return `${Math.floor(diff/3600_000)}小时前`
  if (diff < 2592000_000) return `${Math.floor(diff/86400_000)}天前`
  // ≥30天：年月日，今年省略年份
  const d = new Date(iso)
  const now = new Date()
  const md = `${d.getMonth()+1}月${d.getDate()}日`
  return d.getFullYear() === now.getFullYear() ? md : `${d.getFullYear()}年${md}`
}
```
- 纯函数，可单测
- 边界：未来时间/非法 iso 兜底（返回空或原值）

### D4. 两处接入（不含文章卡片）
- **详情页**：作者区昵称**下方**显示发布时间（`publishedAt || createdAt`），text-xs text-ink-sub
- **CommentItem**：操作行改为两端分布——**左侧显示评论时间**（createdAt），**右侧点赞/回复/删除**按钮
- PostCard 文章卡片**不显示时间**（用户调整）
- 显示样式：text-xs text-ink-sub

## Risks / Open Questions

- ImageMagick 4-bit colormap 输出：单色图标够用，若边缘锯齿可加 `-density`/抗锯齿参数
- 图标视觉：iconfont 单色 path 转 PNG 后是纯色剪影，符合 tabBar 常规
- 时间字段可能为空（草稿无 publishedAt）：PostCard 用 publishedAt||createdAt 兜底
