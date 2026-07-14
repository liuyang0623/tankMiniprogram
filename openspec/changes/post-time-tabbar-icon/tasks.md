# Implementation Tasks — post-time-tabbar-icon（TabBar 图标 + 相对时间）

## 1. 相对时间工具

- [x] 1.1 `src/utils/time.ts`：`formatRelativeTime(iso)` — 刚刚/x分钟前/x小时前/x天前/年月日
- [x] 1.2 边界处理：空/非法 iso 兜底、未来时间
- [x] 1.3 `src/utils/__tests__/time.test.ts`：各阈值单测

## 2. 两处接入相对时间

- [x] 2.1 `pages/detail`：作者区昵称下方显示发布时间（`publishedAt || createdAt`）
- [x] 2.2 `CommentItem`：操作行改两端分布，左侧评论时间 `createdAt`，右侧点赞/回复/删除

## 3. TabBar 图标生成

- [x] 3.1 `scripts/gen-tabbar-icons.mjs`：从 icons.ts 提取 shouye/xiaoxi_o/gerentouxiang_o，拼 svg → ImageMagick 转 81×81 PNG
- [x] 3.2 每图标 2 套色：未选 #8A7F76 / 选中 #F0A868
- [x] 3.3 输出 `src/assets/tabbar/`：home/message/profile × normal/active（6 PNG）
- [x] 3.4 跑脚本生成，产物入 git

## 4. TabBar 配置图标

- [x] 4.1 `app.config.ts`：三 tab 加 iconPath/selectedIconPath
- [x] 4.2 确认 assets 路径正确（相对 src）

## 5. 验证

- [x] 5.1 tsc 类型检查通过
- [x] 5.2 单测通过（formatRelativeTime）
- [x] 5.3 weapp 编译通过
- [x] 5.4 真机冒烟：tabBar 图标显示（选中/未选变色）、卡片/详情/评论时间显示
