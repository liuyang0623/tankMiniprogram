---
comet_change: profile-and-experience-polish
role: technical-design
canonical_spec: openspec
---

# profile-and-experience-polish 技术设计

> 深化 `openspec/changes/profile-and-experience-polish/design.md`。需求与验收场景以 `specs/*/spec.md` 为准。本 Doc 聚焦实现方案、技术风险、测试策略、边界条件。

## 1. 概览

「摆烂随笔」体验优化，纯前端，go-service 零改动。4 项优化：详情结构骨架、草稿删除内移、发布 401 优化、个人中心设置抽屉。暗黑模式已剥离到后续 change，本次主题入口仅占位。

```
pages/detail   → DetailSkeleton（结构化加载态）
pages/drafts   → PostCard action 插槽内放删除按钮
pages/publish  → 401 模态引导重登（isUnauthorized 判断）
pages/profile  → 设置按钮 → SettingsDrawer（右滑全屏）
components/
  PostCard     → 加可选 action prop
  DetailSkeleton → 新增
  SettingsDrawer → 新增
utils/http.ts  → isUnauthorized(err) 纯函数
```

## 2. 详情页结构化骨架屏

- 新增 `components/DetailSkeleton`：复用现有 `Skeleton` 的底色/`anim` token，拼装详情页结构：
  - 标题条（宽色块，高 ~48rpx）
  - 作者行（头像圆 + 昵称条）
  - 正文块（若干宽度递减的行块）
- `pages/detail` 的 `state === 'loading'` 分支用 `<DetailSkeleton />` 替换 `<Skeleton rows={6}>`

## 3. 草稿删除按钮内移（PostCard 加 action）

- `PostCard` props 扩展：`{ post: Post; action?: ReactNode }`
- `Card` 内容顶部或右上角绝对定位渲染 `action`（`View` 定位 `absolute top/right`），`action` 区域点击 `stopPropagation`，不触发卡片 `goDetail`
- 草稿箱 `pages/drafts`：删除按钮作为 `action` 传入 `<PostCard post={p} action={<删除按钮 />} />`，删除逻辑不变（二次确认 → remove → setList 移除）
- 回归：信息流/我的帖子不传 action，渲染与现状一致

**边界**：Taro 中卡片内点击事件冒泡——action 的 onClick 需 `e.stopPropagation()`，避免点删除同时触发卡片跳转

## 4. 发布 401 登录过期优化

- 新增纯函数 `utils/http.ts`：
```ts
import { ApiError } from '../services/errors'
export function isUnauthorized(err: unknown): boolean {
  return err instanceof ApiError && err.code === 401
}
```
- **发布时 401**（`pages/publish` submit catch）：
  - `if (isUnauthorized(e))` → `Taro.showModal({ title:'登录已过期', content:'请重新登录后再发布' })` → 确认 `login()` → 成功提示可重试
  - title/正文/话题全程保留在 state，不清空
  - 非 401 错误走原「发布失败，请重试」
- **自动保存时 401**（`useDraftAutosave` catch）：
  - `if (isUnauthorized(e))` → 不弹窗，setStatus 转特殊态（扩展 SaveStatus 或复用 idle + 外部提示）；SaveStatus 显示「登录已过期」，保留内容，不打断编辑
  - 请求层已在 401 时 clear() 登录态，前端只补提示

## 5. 设置抽屉（SettingsDrawer）

- 新增 `components/SettingsDrawer`：
  - props：`{ open: boolean; onClose: () => void }`
  - 结构：遮罩层（`fixed inset-0 bg-black/30`，`catchMove` + onClick onClose）+ 右侧面板（`fixed right-0 top-0 h-screen w-[80%]`，`transform: translateX(open?0:100%)`，`transition: transform .28s`）
  - 仅 transform/opacity 动效
  - 内容自上而下：
    1. 顶部标题「设置」+ 关闭按钮
    2. 主题切换入口（占位：禁用态灰色 + 小字「即将上线」，点击 showToast 提示或无响应）
    3. 草稿箱入口（`navigateTo /pages/drafts/index`）
    4. 退出登录（置底，`showModal` 二次确认 → `logout()`）
- `pages/profile`：
  - 资料卡右上角或页面顶部加设置按钮（齿轮图标或「设置」文字），点击 `setDrawerOpen(true)`
  - **移除**页面底部退出登录、Tab 上方草稿箱入口（迁移进抽屉）
  - `<SettingsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />`

**边界**：抽屉 open 时遮罩 `catchMove` 阻止背景滚动穿透；退出登录后关抽屉并回未登录态

## 6. 测试策略

- **单元（vitest）**：`isUnauthorized(err)`（ApiError 401 → true / ApiError 500 → false / 普通 Error → false / null → false）
- **tsc + weapp 编译**
- **真机冒烟**：详情结构骨架、草稿卡片内删除（不误触跳转）、发布 401 模态引导+内容保留、自动保存 401 提示、设置抽屉滑入/遮罩关闭、抽屉三项入口、退出登录二次确认

## 7. 风险与缓解

| 风险 | 缓解 |
|------|------|
| PostCard 加 action 影响既有列表 | action 可选，不传行为不变，回归信息流卡片 |
| 卡片内删除点击冒泡触发跳转 | action onClick stopPropagation |
| 全屏抽屉遮罩滚动穿透 | 遮罩 catchMove 阻止背景滚动 |
| 401 提示与请求层 clear() 时序 | clear() 已在请求层，前端只补提示+引导，注意 isLogin 已 false 的 UI |
| 自动重登复杂度 | 不做自动重登+重试，发布用模态手动引导（决策 A） |
| 主题占位与下个 change 衔接 | 禁用态占位，暗黑 change 接入切换逻辑 |

## 8. 非目标（YAGNI）

不做暗黑模式本身（后续 change）；不改 go-service；不做主题自定义/多主题；不重构请求层整体错误处理；不做自动重登+自动重试。
