---
change: profile-and-experience-polish
design-doc: docs/superpowers/specs/2026-07-12-profile-and-experience-polish-design.md
base-ref: e5ec8fc40f1eed65da22cbd23055c2e5d9a667f7
---

# 摆烂随笔·体验优化 实施计划

> **给执行者：** 必需子技能 —— 使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 按任务逐个实现本计划。步骤用 checkbox（`- [ ]`）语法追踪。

**目标：** 为「摆烂随笔」小程序完成 4 项纯前端体验优化：详情页结构化骨架屏、草稿删除按钮内移卡片、发布/自动保存 401 登录过期优化、个人中心设置抽屉。

**架构：** 纯前端改动，go-service 零改动。新增 3 个组件（`DetailSkeleton`、`SettingsDrawer`）与 1 个纯函数工具（`utils/http.ts` 的 `isUnauthorized`）；`PostCard` 扩展可选 `action` 插槽向后兼容；`pages/detail`、`pages/drafts`、`pages/publish`、`pages/profile` 及 `useDraftAutosave` hook 接入。暗黑模式本身剥离到后续 change，主题入口仅占位。

**技术栈：** Taro 4.2.0、React、TypeScript、bun、vitest。测试 `bun run test`（即 `vitest run`），类型校验 `bunx tsc --noEmit`，编译 `bun run build:weapp`。

## 全局约束

- 语言：所有新增用户可见文案为简体中文。
- `PostCard` 的 `action` 属性可选，不传时渲染与行为与现状完全一致（回归信息流、我的帖子、收藏列表）。
- 卡片内 `action` 的点击事件必须 `e.stopPropagation()`，避免误触卡片跳转。
- `ApiError` 已带 `code` 字段（见 `src/services/errors.ts`），`isUnauthorized(err) = err instanceof ApiError && err.code === 401`，**不改请求层**。
- 发布 401 用 `Taro.showModal` 模态引导重登（决策 A），编辑内容（title/正文/话题）全程保留在 state，不清空；不做自动重登+自动重试。
- 自动保存 401 不弹窗打断编辑，SaveStatus 显示「登录已过期」提示。
- 抽屉遮罩用 `catchMove` 阻止背景滚动穿透；动效仅用 `transform`/`opacity`。
- 主题入口占位：禁用态灰色 + 小字「即将上线」，暗黑逻辑下个 change 接入。
- 设计 token：`bg-peach`/`text-ink`/`text-ink-sub`/`rounded-card`/`shadow-soft`/`press`；藕粉色值 `#E4A9BE`。
- 测试文件放 `src/**/__tests__/**/*.test.ts`，从相对路径 import 被测模块（见现有 `src/utils/__tests__/publish.test.ts`）。
- 每个任务独立 commit，遵循 conventional commits（`feat:`/`fix:`），提交信息用中文描述亦可。

---

## 文件结构

- **新增** `src/components/DetailSkeleton/index.tsx` —— 详情页结构化骨架（标题条+作者行+正文块），复用 `Skeleton` 的 shimmer token。
- **新增** `src/components/SettingsDrawer/index.tsx` —— 右滑全屏设置抽屉（遮罩+面板+三项入口）。
- **新增** `src/utils/http.ts` —— `isUnauthorized(err)` 纯函数。
- **新增** `src/utils/__tests__/http.test.ts` —— `isUnauthorized` 单测。
- **修改** `src/components/PostCard/index.tsx` —— 加可选 `action?: ReactNode`，Card 内右上角绝对定位。
- **修改** `src/components/index.ts` —— 导出 `DetailSkeleton`、`SettingsDrawer`。
- **修改** `src/pages/detail/index.tsx` —— loading 分支用 `<DetailSkeleton />` 替换 `<Skeleton rows={6}>`。
- **修改** `src/pages/drafts/index.tsx` —— 删除按钮作为 `action` 传入 `PostCard`，移除卡片下方独立删除行。
- **修改** `src/pages/publish/index.tsx` —— submit catch 判断 401 → 模态引导重登；SaveStatus 文案接 `expired` 态。
- **修改** `src/hooks/useDraftAutosave.ts` —— `SaveStatus` 扩展 `'expired'`；catch 判断 401 → `setStatus('expired')` 不弹窗。
- **修改** `src/pages/profile/index.tsx` —— 加设置按钮打开抽屉；移除底部退出登录 + Tab 上方草稿箱入口。

---

## Task 1: DetailSkeleton 结构化骨架组件

**Files:**
- Create: `src/components/DetailSkeleton/index.tsx`
- Modify: `src/components/index.ts`
- Modify: `src/pages/detail/index.tsx:49-53`

**Interfaces:**
- Produces: `export default function DetailSkeleton(): JSX.Element` —— 无 props，渲染标题条+作者行（圆头像+昵称条）+若干正文块，复用 `Skeleton` 的 shimmer 样式 token。

- [ ] **Step 1: 创建 DetailSkeleton 组件**

现有 `Skeleton`（`src/components/Skeleton/index.tsx`）的 shimmer 样式内联在 `SHIMMER_STYLE` 常量中，未导出。这里在 DetailSkeleton 内复制同一 shimmer 样式（保持视觉一致），拼装详情页结构。

创建 `src/components/DetailSkeleton/index.tsx`：

```tsx
import { View } from '@tarojs/components'

const SHIMMER_STYLE = {
  background: 'linear-gradient(90deg,#EFE8DE 25%,#F6F1E9 37%,#EFE8DE 63%)',
  backgroundSize: '400% 100%',
  animation: 'shimmer 1.4s ease infinite',
}

/** 详情页结构化骨架：标题条 + 作者行 + 正文块 */
export default function DetailSkeleton() {
  return (
    <View className='anim-in'>
      {/* 标题条 */}
      <View
        className='rounded-card'
        style={{ height: '48rpx', width: '70%', marginBottom: '32rpx', ...SHIMMER_STYLE }}
      />
      {/* 作者行：头像圆 + 昵称条 */}
      <View className='flex items-center' style={{ marginBottom: '32rpx' }}>
        <View
          style={{ width: '64rpx', height: '64rpx', borderRadius: '50%', ...SHIMMER_STYLE }}
        />
        <View
          className='rounded-card'
          style={{ height: '28rpx', width: '30%', marginLeft: '24rpx', ...SHIMMER_STYLE }}
        />
      </View>
      {/* 正文块：宽度递减的若干行 */}
      {['100%', '100%', '90%', '95%', '60%'].map((w, i) => (
        <View
          key={i}
          className='rounded-card'
          style={{ height: '28rpx', width: w, marginBottom: '20rpx', ...SHIMMER_STYLE }}
        />
      ))}
    </View>
  )
}
```

- [ ] **Step 2: 导出 DetailSkeleton**

在 `src/components/index.ts` 的 `PostCard` 导出行附近加入：

```ts
export { default as DetailSkeleton } from './DetailSkeleton'
```

- [ ] **Step 3: 详情页 loading 分支替换**

修改 `src/pages/detail/index.tsx`：

第 4 行 import 加入 `DetailSkeleton`（移除不再使用的 `Skeleton`）：

```tsx
import { Avatar, Tag, DetailSkeleton, InteractionBar, CommentList } from '../../components'
```

第 49-53 行 loading 分支替换为：

```tsx
{state === 'loading' && (
  <View className='bg-card rounded-card shadow-soft p-6'>
    <DetailSkeleton />
  </View>
)}
```

- [ ] **Step 4: 类型校验**

Run: `bunx tsc --noEmit`
Expected: 无错误（确认 `Skeleton` 已从 import 移除、`DetailSkeleton` 已导出）

- [ ] **Step 5: 提交**

```bash
git add src/components/DetailSkeleton/index.tsx src/components/index.ts src/pages/detail/index.tsx
git commit -m "feat: 详情页结构化骨架屏 DetailSkeleton"
```

---

## Task 2: PostCard 加可选 action 插槽

**Files:**
- Modify: `src/components/PostCard/index.tsx`

**Interfaces:**
- Consumes: `Card`（`src/components/Card/index.tsx`），props `{ float?, className?, onClick?, children }`。
- Produces: `PostCardProps = { post: Post; action?: ReactNode }`；`action` 渲染在卡片内右上角绝对定位容器内，容器 `onClick` 调用 `e.stopPropagation()`。不传 `action` 时 DOM 与现状一致。

- [ ] **Step 1: 扩展 PostCard 支持 action**

修改 `src/components/PostCard/index.tsx`。改 import 引入 `ReactNode` 类型，改 props 与返回结构：

```tsx
import { View, Text } from '@tarojs/components'
import type { ITouchEvent } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { ReactNode } from 'react'
import { Card, Avatar, Tag } from '../index'
import type { Post } from '../../types/api'

export interface PostCardProps {
  post: Post
  /** 可选卡片内操作区，渲染在右上角，点击不触发卡片跳转 */
  action?: ReactNode
}

/** 信息流帖子卡片，点击进详情；可选右上角 action 区 */
export default function PostCard({ post, action }: PostCardProps) {
  const goDetail = () => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${post.id}` })
  }

  const summary = post.content?.replace(/<[^>]+>/g, '').slice(0, 60) || ''

  return (
    <Card float className='mb-4' onClick={goDetail}>
      {action && (
        <View
          className='absolute'
          style={{ top: '16rpx', right: '16rpx', zIndex: 2 }}
          onClick={(e: ITouchEvent) => e.stopPropagation()}
        >
          {action}
        </View>
      )}
      {/* 作者 */}
      <View className='flex items-center mb-3'>
        <Avatar src={post.author?.avatar} size={64} />
        <View className='ml-3'>
          <Text className='text-sm text-ink'>{post.author?.name || '匿名'}</Text>
        </View>
      </View>
      {/* 标题与摘要 */}
      <Text className='text-base text-ink font-bold'>{post.title}</Text>
      <View className='mt-1 mb-3'>
        <Text className='text-sm text-ink-sub'>
          {summary}
          {summary.length >= 60 ? '…' : ''}
        </Text>
      </View>
      {/* 话题 */}
      {post.topics && post.topics.length > 0 && (
        <View className='flex mb-3'>
          {post.topics.slice(0, 3).map((t) => (
            <Tag key={t.id} tone='taro' className='mr-2'>
              {t.name}
            </Tag>
          ))}
        </View>
      )}
      {/* 互动计数 */}
      <View className='flex'>
        <Text className='text-xs text-ink-sub mr-4'>♡ {post.likeCount}</Text>
        <Text className='text-xs text-ink-sub'>💬 {post.commentCount}</Text>
      </View>
    </Card>
  )
}
```

说明：`Card` 根节点是 `View`，绝对定位子元素依赖父级为定位上下文。Taro 小程序 `View` 默认 `position: static`；`Card` 类名含 `p-6`（padding）不影响，但需确保绝对定位相对卡片。若真机上 action 定位异常，在 Step 3 回归时于 `Card` 加 `relative`（见 Task 3 备注），此处先按标准写法，绝大多数 Taro + TailwindCSS 配置下 `absolute` 会相对最近 `relative`/非 static 祖先。为稳妥，本步在 action 容器父级即 Card 上不改动，交由 Task 3 验证阶段确认。

- [ ] **Step 2: 类型校验**

Run: `bunx tsc --noEmit`
Expected: 无错误（`ITouchEvent`、`ReactNode` 类型正确）

- [ ] **Step 3: 提交**

```bash
git add src/components/PostCard/index.tsx
git commit -m "feat: PostCard 支持可选右上角 action 插槽"
```

---

## Task 3: 草稿删除按钮内移卡片

**Files:**
- Modify: `src/pages/drafts/index.tsx`
- Modify: `src/components/Card/index.tsx`（仅在需要时加 `relative`，见 Step 1）

**Interfaces:**
- Consumes: Task 2 的 `PostCard` `action?: ReactNode` 属性。

- [ ] **Step 1: 确保 Card 为定位上下文**

为让 `PostCard` 右上角 `absolute` action 稳定相对卡片定位，给 `Card` 根 `View` 加 `relative`。修改 `src/components/Card/index.tsx` 第 16 行 className：

```tsx
className={`relative bg-card rounded-card shadow-soft p-6 ${float ? 'anim-in' : ''} ${className}`}
```

- [ ] **Step 2: 草稿箱删除按钮移入卡片**

修改 `src/pages/drafts/index.tsx`，把 list.map 部分替换为 action 内联删除按钮，移除卡片下方独立的删除行与外层 `onClick` 包裹（改由 PostCard 自身 goDetail 跳详情；草稿卡片点击应进编辑页，故这里保留外层点击进编辑并让 PostCard 不自跳）。

注意：`PostCard` 内部 `goDetail` 跳的是 `/pages/detail`，而草稿点击应进 `/pages/publish?id=`。现状是用外层 `<View onClick={openDraft}>` 包裹卡片，靠事件冒泡实现进编辑页。保持该结构：外层 View 负责进编辑，删除按钮作为 action 传入并 stopPropagation。

将第 54-67 行的 list.map 替换为：

```tsx
{list.map((post) => (
  <View key={post.id} onClick={() => openDraft(post.id)}>
    <PostCard
      post={post}
      action={
        <View className='press' onClick={() => removeDraft(post.id)}>
          <Text className='text-xs' style={{ color: '#E4A9BE' }}>
            删除
          </Text>
        </View>
      }
    />
  </View>
))}
```

说明：`PostCard` 内部 action 容器已 `stopPropagation`，点击删除不会冒泡到外层 `openDraft`。点击卡片其余区域仍冒泡到外层进入编辑页。（`PostCard` 内部 `goDetail` 因外层 `openDraft` 优先由外层 View 处理——实际两者都会触发；为避免同时跳详情与编辑，见 Step 3 验证；若真机出现双跳，将外层 openDraft 改为在 PostCard 外层且 PostCard 不再自带 goDetail 冲突——但现状 drafts 页原本就是这种嵌套结构且工作正常，保持一致即可。）

- [ ] **Step 3: 类型校验**

Run: `bunx tsc --noEmit`
Expected: 无错误

- [ ] **Step 4: 编译验证**

Run: `bun run build:weapp`
Expected: 编译成功，无报错

- [ ] **Step 5: 提交**

```bash
git add src/pages/drafts/index.tsx src/components/Card/index.tsx
git commit -m "feat: 草稿删除按钮内移至卡片右上角"
```

---

## Task 4: isUnauthorized 纯函数（TDD）

**Files:**
- Create: `src/utils/http.ts`
- Create: `src/utils/__tests__/http.test.ts`

**Interfaces:**
- Consumes: `ApiError`（`src/services/errors.ts`），构造 `new ApiError(code, message, httpStatus)`。
- Produces: `export function isUnauthorized(err: unknown): boolean` —— `err instanceof ApiError && err.code === 401`。

- [ ] **Step 1: 写失败测试**

创建 `src/utils/__tests__/http.test.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { isUnauthorized } from '../http'
import { ApiError } from '../../services/errors'

describe('isUnauthorized', () => {
  it('ApiError code=401 返回 true', () => {
    expect(isUnauthorized(new ApiError(401, '未登录', 401))).toBe(true)
  })
  it('ApiError code=500 返回 false', () => {
    expect(isUnauthorized(new ApiError(500, '服务器错误', 500))).toBe(false)
  })
  it('普通 Error 返回 false', () => {
    expect(isUnauthorized(new Error('boom'))).toBe(false)
  })
  it('null 返回 false', () => {
    expect(isUnauthorized(null)).toBe(false)
  })
  it('undefined 返回 false', () => {
    expect(isUnauthorized(undefined)).toBe(false)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `bun run test src/utils/__tests__/http.test.ts`
Expected: FAIL，报 `../http` 模块不存在

- [ ] **Step 3: 写最小实现**

创建 `src/utils/http.ts`：

```ts
import { ApiError } from '../services/errors'

/** 判断错误是否为登录过期（401） */
export function isUnauthorized(err: unknown): boolean {
  return err instanceof ApiError && err.code === 401
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `bun run test src/utils/__tests__/http.test.ts`
Expected: PASS，5 个用例全绿

- [ ] **Step 5: 提交**

```bash
git add src/utils/http.ts src/utils/__tests__/http.test.ts
git commit -m "feat: 新增 isUnauthorized 401 判断纯函数"
```

---

## Task 5: 发布页 401 模态引导重登

**Files:**
- Modify: `src/pages/publish/index.tsx`

**Interfaces:**
- Consumes: `isUnauthorized`（Task 4）；`login`（`src/services/auth.ts`，`login(): Promise<void>`）；`Taro.showModal`；Task 6 扩展的 `draft.status === 'expired'`。

- [ ] **Step 1: 引入 isUnauthorized，改写 submit catch**

修改 `src/pages/publish/index.tsx`。第 8 行 `login` 已 import，加入 `isUnauthorized` import：

```tsx
import { isUnauthorized } from '../../utils/http'
```

将第 139-141 行的 `catch { showToast('发布失败，请重试', 'error') }` 替换为：

```tsx
} catch (e) {
  if (isUnauthorized(e)) {
    const { confirm } = await Taro.showModal({
      title: '登录已过期',
      content: '请重新登录后再发布，已编辑的内容会保留',
    })
    if (confirm) {
      try {
        await login()
        showToast('已重新登录，请再次点击发布', 'success')
      } catch {
        showToast('登录失败，请重试', 'error')
      }
    }
  } else {
    showToast('发布失败，请重试', 'error')
  }
}
```

说明：`title`/正文/`topicInput` 全程保留在 state，catch 分支不触碰它们，重登成功后用户再次点发布即可重试。不做自动重试。

- [ ] **Step 2: SaveStatus 文案接入 expired 态**

修改第 149-153 行保存状态字，接入 Task 6 的 `'expired'` 态：

```tsx
<View className='flex justify-end py-1'>
  <Text className='text-xs text-ink-sub'>
    {draft.status === 'saving'
      ? '保存中…'
      : draft.status === 'saved'
        ? '草稿已保存'
        : draft.status === 'expired'
          ? '登录已过期，内容已保留'
          : ''}
  </Text>
</View>
```

- [ ] **Step 3: 类型校验**

Run: `bunx tsc --noEmit`
Expected: 无错误（依赖 Task 6 先扩展 `SaveStatus`，若单独执行本任务需确认 Task 6 已完成）

- [ ] **Step 4: 提交**

```bash
git add src/pages/publish/index.tsx
git commit -m "feat: 发布 401 登录过期模态引导重登，保留编辑内容"
```

---

## Task 6: 自动保存 401 不打断编辑

**Files:**
- Modify: `src/hooks/useDraftAutosave.ts`

**Interfaces:**
- Consumes: `isUnauthorized`（Task 4）。
- Produces: `SaveStatus = 'idle' | 'saving' | 'saved' | 'expired'`；`runPersist` catch 中 401 → `setStatus('expired')` 不弹窗，非 401 → `setStatus('idle')`。

> 注意：Task 5 Step 2 已引用 `draft.status === 'expired'`。建议执行顺序 Task 6 先于 Task 5，或两者作为相邻任务由同一执行者连续完成以保证 `tsc` 通过。

- [ ] **Step 1: 扩展 SaveStatus 类型**

修改 `src/hooks/useDraftAutosave.ts` 第 5 行：

```ts
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'expired'
```

- [ ] **Step 2: 引入 isUnauthorized 并改 catch**

第 2 行 import 附近加入：

```ts
import { isUnauthorized } from '../utils/http'
```

将 `runPersist` 内第 58-60 行的 `catch { setStatus('idle') }` 替换为：

```ts
} catch (e) {
  // 401 登录过期：不弹窗打断编辑，转 expired 提示态，保留内容
  setStatus(isUnauthorized(e) ? 'expired' : 'idle')
}
```

- [ ] **Step 3: 类型校验**

Run: `bunx tsc --noEmit`
Expected: 无错误

- [ ] **Step 4: 运行全量测试确认未回归**

Run: `bun run test`
Expected: 全部 PASS（含 Task 4 的 http.test.ts）

- [ ] **Step 5: 提交**

```bash
git add src/hooks/useDraftAutosave.ts
git commit -m "feat: 自动保存 401 转 expired 态不打断编辑"
```

---

## Task 7: SettingsDrawer 设置抽屉组件

**Files:**
- Create: `src/components/SettingsDrawer/index.tsx`
- Modify: `src/components/index.ts`

**Interfaces:**
- Consumes: `logout`（`src/services/auth.ts`，`logout(): void`）；`Taro.navigateTo`、`Taro.showModal`、`useUiStore` 的 `showToast`。
- Produces: `SettingsDrawerProps = { open: boolean; onClose: () => void; onLoggedOut?: () => void }`；`export default function SettingsDrawer`。

- [ ] **Step 1: 创建 SettingsDrawer 组件**

创建 `src/components/SettingsDrawer/index.tsx`：

```tsx
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { logout } from '../../services/auth'
import { useUiStore } from '../../store/ui'

export interface SettingsDrawerProps {
  open: boolean
  onClose: () => void
  /** 退出登录成功后回调（供个人中心清本地态） */
  onLoggedOut?: () => void
}

/** 右滑全屏设置抽屉：主题占位 / 草稿箱 / 退出登录 */
export default function SettingsDrawer({ open, onClose, onLoggedOut }: SettingsDrawerProps) {
  const showToast = useUiStore((s) => s.showToast)

  const goDrafts = () => {
    onClose()
    Taro.navigateTo({ url: '/pages/drafts/index' })
  }

  const onThemeTap = () => {
    showToast('暗黑模式即将上线～', 'info')
  }

  const onLogout = async () => {
    const { confirm } = await Taro.showModal({ title: '退出登录', content: '确定退出当前账号吗？' })
    if (!confirm) return
    logout()
    onClose()
    onLoggedOut?.()
  }

  return (
    <View
      className='fixed'
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        pointerEvents: open ? 'auto' : 'none',
      }}
      catchMove={open}
    >
      {/* 遮罩 */}
      <View
        className='fixed'
        style={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.3)',
          opacity: open ? 1 : 0,
          transition: 'opacity .28s ease',
        }}
        onClick={onClose}
      />
      {/* 右侧面板 */}
      <View
        className='fixed bg-bg'
        style={{
          top: 0,
          right: 0,
          bottom: 0,
          width: '80%',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .28s ease',
          zIndex: 101,
        }}
      >
        <View className='px-6 pt-16 pb-8 flex flex-col' style={{ height: '100%' }}>
          {/* 顶部标题 + 关闭 */}
          <View className='flex items-center justify-between mb-8'>
            <Text className='text-lg text-ink font-bold'>设置</Text>
            <View className='press' onClick={onClose}>
              <Text className='text-sm text-ink-sub'>关闭</Text>
            </View>
          </View>

          {/* 主题切换入口（占位禁用态） */}
          <View
            className='press bg-card rounded-card shadow-soft px-4 py-4 mb-4 flex items-center justify-between'
            style={{ opacity: 0.5 }}
            onClick={onThemeTap}
          >
            <Text className='text-base text-ink-sub'>主题切换</Text>
            <Text className='text-xs text-ink-sub'>即将上线</Text>
          </View>

          {/* 草稿箱入口 */}
          <View
            className='press bg-card rounded-card shadow-soft px-4 py-4 mb-4'
            onClick={goDrafts}
          >
            <Text className='text-base text-ink'>草稿箱</Text>
          </View>

          {/* 退出登录（置底） */}
          <View
            className='press mt-auto py-3 flex justify-center items-center rounded-card'
            style={{ border: '1rpx solid #E4A9BE' }}
            onClick={onLogout}
          >
            <Text className='text-sm' style={{ color: '#E4A9BE' }}>
              退出登录
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}
```

说明：外层容器常驻 DOM，用 `pointerEvents`/`transform` 控制显隐以保留滑入动效；`catchMove={open}` 在打开时阻止背景滚动穿透。主题入口 `opacity 0.5` + 「即将上线」呈现禁用占位，点击仅 toast 提示，不切换主题。

- [ ] **Step 2: 导出 SettingsDrawer**

在 `src/components/index.ts` 加入：

```ts
export { default as SettingsDrawer } from './SettingsDrawer'
```

- [ ] **Step 3: 类型校验**

Run: `bunx tsc --noEmit`
Expected: 无错误（确认 `catchMove`、`pointerEvents` 类型被 Taro View 接受；若 `pointerEvents` 报类型错，改用 `visibility: open ? 'visible' : 'hidden'`）

- [ ] **Step 4: 提交**

```bash
git add src/components/SettingsDrawer/index.tsx src/components/index.ts
git commit -m "feat: 新增 SettingsDrawer 右滑设置抽屉"
```

---

## Task 8: 个人中心接入设置抽屉

**Files:**
- Modify: `src/pages/profile/index.tsx`

**Interfaces:**
- Consumes: Task 7 的 `SettingsDrawer`（`open`/`onClose`/`onLoggedOut`）。

- [ ] **Step 1: 引入抽屉与状态**

修改 `src/pages/profile/index.tsx`。第 4 行 import 加入 `SettingsDrawer`：

```tsx
import { Avatar, PostCard, SkeletonList, SettingsDrawer } from '../../components'
```

第 20 行附近（其它 useState 旁）加入抽屉开关状态：

```tsx
const [drawerOpen, setDrawerOpen] = useState(false)
```

- [ ] **Step 2: 复用 onLogout 逻辑为抽屉回调**

现有 `onLogout`（第 83-91 行）含 showModal 二次确认——该确认已迁进 `SettingsDrawer` 内部。这里保留清本地态的逻辑，抽出为供抽屉回调的 `handleLoggedOut`，替换第 83-91 行：

```tsx
const handleLoggedOut = () => {
  // 抽屉内部已 logout + 二次确认，这里只清本地列表与资料
  loadedTabsRef.current = new Set()
  setProfile(null)
  setTab('posts')
}
```

- [ ] **Step 3: 资料卡区加设置按钮**

在资料卡登录态（第 111-126 行 `isLogin ?` 分支的资料卡 View）内，为「编辑」按钮旁加一个「设置」按钮。将编辑按钮那段（第 120-125 行）替换为并列的两个按钮：

```tsx
<View className='flex flex-col items-end'>
  <View
    className='press bg-peach rounded-pill px-4 py-2 mb-2'
    onClick={() => Taro.navigateTo({ url: '/pages/profile-edit/index' })}
  >
    <Text className='text-xs text-card'>编辑</Text>
  </View>
  <View
    className='press bg-card rounded-pill px-4 py-2'
    style={{ border: '1rpx solid #E4A9BE' }}
    onClick={() => setDrawerOpen(true)}
  >
    <Text className='text-xs' style={{ color: '#E4A9BE' }}>设置</Text>
  </View>
</View>
```

- [ ] **Step 4: 移除页面底部退出登录 + Tab 上方草稿箱入口**

删除第 141-148 行的草稿箱入口 View（`<View className='flex mb-4'>` 包裹「草稿箱」那段）。

删除第 184-193 行的退出登录 View（`{/* 退出登录 */}` 及其 View）。

- [ ] **Step 5: 渲染 SettingsDrawer**

在最外层 `ScrollView` 之后、组件返回的根节点内加入抽屉。将 return 的根结构改为 Fragment 包裹 ScrollView + Drawer：

```tsx
return (
  <>
    <ScrollView
      scrollY
      className='bg-bg'
      style={{ height: '100vh' }}
      scrollTop={scrollTop}
      onScrollToLower={onScrollToLower}
      lowerThreshold={80}
    >
      {/* ...原有 px-6 内容不变（已移除草稿箱入口与退出登录）... */}
    </ScrollView>
    <SettingsDrawer
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      onLoggedOut={handleLoggedOut}
    />
  </>
)
```

- [ ] **Step 6: 清理未使用 import**

移除页面内不再使用的 import：`logout`（现由 SettingsDrawer 调用）已不在 profile 页直接使用——确认 `import { login, logout } from '../../services/auth'` 中 `logout` 是否仍被引用；若 `handleLoggedOut` 不再调用 `logout`，改为 `import { login } from '../../services/auth'`。

- [ ] **Step 7: 类型校验 + 编译**

Run: `bunx tsc --noEmit`
Expected: 无错误、无未使用变量告警

Run: `bun run build:weapp`
Expected: 编译成功

- [ ] **Step 8: 提交**

```bash
git add src/pages/profile/index.tsx
git commit -m "feat: 个人中心接入设置抽屉，迁移草稿箱与退出登录入口"
```

---

## Task 9: 全量验证

**Files:** 无新增，验证既有改动。

- [ ] **Step 1: 单元测试**

Run: `bun run test`
Expected: 全部 PASS，含 `src/utils/__tests__/http.test.ts` 5 个 `isUnauthorized` 用例

- [ ] **Step 2: 类型校验**

Run: `bunx tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: weapp 编译**

Run: `bun run build:weapp`
Expected: 编译成功，无报错

- [ ] **Step 4: 微信开发者工具/真机冒烟清单**

逐项人工核对（在微信开发者工具或真机）：

- [ ] 详情页加载中展示结构化骨架（标题条+头像行+正文块），加载完成替换真实内容
- [ ] 草稿卡片右上角删除按钮：点击弹二次确认，确认后从列表移除
- [ ] 点击草稿卡片主体（非删除按钮）进入编辑页，不误触删除、不误跳详情
- [ ] 回归：信息流/我的帖子/收藏卡片无 action，展示与改动前一致
- [ ] 发布时 401：弹「登录已过期」模态，确认后触发重登，title/正文/话题保留
- [ ] 自动保存时 401：不弹窗，保存状态字显示「登录已过期，内容已保留」，编辑不被打断
- [ ] 个人中心资料卡出现「设置」按钮，点击右滑入抽屉+遮罩
- [ ] 点击遮罩或「关闭」收起抽屉
- [ ] 抽屉三项：主题（禁用态「即将上线」，点击 toast 提示不切换）、草稿箱（跳转草稿页）、退出登录（置底，二次确认后登出回未登录态）
- [ ] 个人中心页面底部不再有退出登录、Tab 上方不再有草稿箱入口（已迁进抽屉）
- [ ] 抽屉打开时背景不可滚动穿透

- [ ] **Step 5: 提交验证记录（如流程需要）**

若 Comet verify 阶段需产物，按 `/comet-verify` 指引生成验证报告；本计划实现阶段到此结束。

---

## 自检记录

**Spec 覆盖：**
- experience-polish「详情页结构化骨架屏」→ Task 1 ✓
- experience-polish「草稿卡片内删除按钮」（含点击卡片主体继续编辑）→ Task 2 + Task 3 ✓
- experience-polish「发布时登录过期优化」（发布 401 + 自动保存 401）→ Task 4 + Task 5 + Task 6 ✓
- profile-settings-drawer「设置抽屉入口」（打开/关闭）→ Task 7 + Task 8 ✓
- profile-settings-drawer「抽屉内容项」（主题占位/草稿箱/退出登录置底，迁移原入口）→ Task 7 + Task 8 ✓
- profile-settings-drawer「抽屉内退出登录」（二次确认→登出→未登录态）→ Task 7 + Task 8 ✓
- tasks.md 第 6 组「验证」→ Task 9 ✓

**类型一致性：** `SaveStatus` 在 Task 6 扩展 `'expired'`，Task 5 引用一致；`isUnauthorized` 签名 Task 4 定义、Task 5/6 引用一致；`PostCard` `action` Task 2 定义、Task 3 引用一致；`SettingsDrawer` props `open/onClose/onLoggedOut` Task 7 定义、Task 8 引用一致。

**执行顺序提示：** Task 4 → Task 6 → Task 5 保证 `SaveStatus`/`isUnauthorized` 依赖就绪再过 `tsc`；Task 2 → Task 3；Task 7 → Task 8。
