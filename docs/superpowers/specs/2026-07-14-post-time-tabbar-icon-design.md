---
comet_change: post-time-tabbar-icon
role: technical-design
canonical_spec: openspec
---

# TabBar 图标 + 相对时间显示 Design Doc

## 架构

```
相对时间：
  src/utils/time.ts  formatRelativeTime(iso)
       ├─→ pages/detail（作者昵称下方）
       └─→ components/CommentItem（操作行左侧）

TabBar 图标：
  scripts/gen-tabbar-icons.mjs
       ├─ 读 src/components/Iconfont/icons.ts
       ├─ 拼 svg（注入 fill 灰/奶橘）
       └─ magick 转 81×81 PNG → src/assets/tabbar/
  app.config.ts tabBar 引用 iconPath/selectedIconPath
```

## 相对时间工具 src/utils/time.ts

```ts
export function formatRelativeTime(iso: string): string {
  if (!iso) return ''
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const diff = Date.now() - t
  if (diff < 0) return '刚刚'          // 未来时间兜底
  if (diff < 60_000) return '刚刚'
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}分钟前`
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}小时前`
  if (diff < 2592000_000) return `${Math.floor(diff / 86400_000)}天前`
  const d = new Date(iso)
  const now = new Date()
  const md = `${d.getMonth() + 1}月${d.getDate()}日`
  return d.getFullYear() === now.getFullYear() ? md : `${d.getFullYear()}年${md}`
}
```

阈值：刚刚(<1分) / x分钟前(<60分) / x小时前(<24时) / x天前(<30天) / 年月日(≥30天，今年省略年份)。
边界：空串/非法 iso → 空串；未来时间 → 刚刚。纯函数，可单测。

## 接入点

### 详情页（pages/detail）
作者区当前昵称单行，昵称下方加发布时间：
```tsx
<View className='ml-3'>
  <Text className='text-sm text-ink'>{post.author?.name || '匿名'}</Text>
  <Text className='text-xs text-ink-sub'>{formatRelativeTime(post.publishedAt || post.createdAt)}</Text>
</View>
```

### CommentItem 操作行
当前操作行是 `点赞 回复 删除` 左对齐。改两端分布：
```tsx
<View className='flex items-center justify-between mt-2'>
  <Text className='text-xs text-ink-sub'>{formatRelativeTime(comment.createdAt)}</Text>
  <View className='flex items-center'>
    {/* 点赞 / 回复 / 删除 */}
  </View>
</View>
```
- 左侧时间，右侧按钮组（点赞/回复/删除保持原逻辑）

## TabBar 图标生成 scripts/gen-tabbar-icons.mjs

```
1. 读 icons.ts，正则提取 shouye/xiaoxi_o/gerentouxiang_o 的 viewBox+paths
2. 对每图标 × 2 色（#8A7F76 未选 / #F0A868 选中）：
   - 拼 svg 字符串（fill 注入色）
   - 写临时 svg 文件
   - magick -background none tmp.svg -resize 81x81 out.png（方案一：直接 81×81 带抗锯齿）
3. 输出 src/assets/tabbar/：
   home.png / home-active.png（shouye）
   message.png / message-active.png（xiaoxi_o）
   profile.png / profile-active.png（gerentouxiang_o）
4. 产物入 git（tabBar 图标不常变，不每次构建跑）
```

## app.config.ts tabBar 配置

```ts
list: [
  { pagePath: 'pages/index/index', text: '首页',
    iconPath: 'assets/tabbar/home.png', selectedIconPath: 'assets/tabbar/home-active.png' },
  { pagePath: 'pages/messages/index', text: '消息',
    iconPath: 'assets/tabbar/message.png', selectedIconPath: 'assets/tabbar/message-active.png' },
  { pagePath: 'pages/profile/index', text: '我的',
    iconPath: 'assets/tabbar/profile.png', selectedIconPath: 'assets/tabbar/profile-active.png' },
]
```
- 路径相对 src（Taro weapp 编译处理）

## 测试策略

- `src/utils/__tests__/time.test.ts`：formatRelativeTime 各阈值 + 边界（空/非法/未来）
- tsc + weapp 编译
- 真机冒烟：tabBar 图标选中变奶橘/未选灰、详情发布时间、评论时间左对齐布局

## 边界与限制

- 81×81 单色 PNG，锯齿可接受（真机若明显再调 magick 参数）
- 时间字段空值：详情用 publishedAt||createdAt 兜底
- 不改后端、不改 messages 时间格式、不显示文章卡片时间
- assets 路径需确认 Taro weapp 编译能正确打包（build 时验证）
