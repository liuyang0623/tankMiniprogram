## Why

两个前端体验优化：
1. TabBar 目前只有文字（首页/消息/我的），缺少图标，视觉单薄。加图标提升辨识度和精致感。
2. 文章卡片、详情页、评论目前都不显示时间，用户无法判断内容新鲜度。按主流方案显示相对时间（刚刚/x分钟前/x小时前/x天前/年月日）。

用户已确认的设计决策：
- TabBar 图标：小程序 tabBar 只支持本地 PNG，用脚本把 iconfont 的 shouye/xiaoxi_o/gerentouxiang_o 转成灰(#8A7F76 未选)+奶橘(#F0A868 选中)两套 PNG
- 相对时间工具抽到 `src/utils/time.ts` 公用，PostCard/详情/CommentItem 共用
- 时间阈值：刚刚(<1分)/x分钟前(<60分)/x小时前(<24时)/x天前(<30天)/年月日(≥30天，今年省略年份)

## What Changes

- **TabBar 图标**：`scripts/gen-tabbar-icons.mjs` 从 icons.ts 提取 3 图标 → ImageMagick 转 6 个 PNG（3图标 × 选中/未选）→ `src/assets/tabbar/`；app.config.ts tabBar 加 iconPath/selectedIconPath
- **相对时间工具**：`src/utils/time.ts` 导出 `formatRelativeTime(iso)`
- **详情页**：作者区昵称下方显示发布时间
- **CommentItem**：操作行改两端分布，左侧评论时间，右侧点赞/回复/删除按钮

## Capabilities

### New Capabilities
- `relative-time-display`: 相对时间显示能力——文章/评论时间按主流相对格式展示
- `tabbar-icons`: TabBar 图标能力——三 tab 本地 PNG 图标

### Modified Capabilities
<!-- 无既有 spec 变更 -->

## Impact

- **新增文件**：
  - `scripts/gen-tabbar-icons.mjs`：tabBar PNG 生成脚本（ImageMagick）
  - `src/assets/tabbar/*.png`：6 个图标（home/message/profile × normal/active）
  - `src/utils/time.ts`：formatRelativeTime
- **修改文件**：
  - `src/app.config.ts`：tabBar list 加 iconPath/selectedIconPath
  - `src/pages/detail/index.tsx`：作者区显示发布时间
  - `src/components/CommentItem/index.tsx`：操作行左侧显示评论时间
  - `src/pages/messages/index.tsx`（可选）：私有 formatTime 改用 utils/time
- **依赖**：ImageMagick（`magick`，已确认沙盒可用）生成 PNG；运行时无新依赖
- **时间字段**：Post.publishedAt/createdAt、Comment.createdAt（后端已返回）
- **不改后端**
