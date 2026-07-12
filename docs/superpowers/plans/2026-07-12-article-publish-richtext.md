---
change: article-publish-richtext
design-doc: docs/superpowers/specs/2026-07-12-article-publish-richtext-design.md
base-ref: 5844047dc038b5e3494d5415d5b9c746da8037ab
archived-with: 2026-07-12-article-publish-richtext
---

# 富文本发布功能（article-publish-richtext）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: 使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实施本计划。步骤用 checkbox（`- [x]`）语法追踪。

**目标：** 为「摆烂随笔」小程序交付富文本发布闭环——微信官方 `<editor>` 富文本编辑器、分层工具栏、图片插入、话题标签、封面自动取首图、草稿自动保存与草稿箱，纯前端实现（go-service 契约已就绪）。

**架构：** 发布页 `pages/publish` tabBar 两用（`router.params.id` 区分新建/编辑），封装 `RichEditor` 组件（`Editor` + `EditorContext` + 分层工具栏 `EditorToolbar`/`MorePanel`），`useDraftAutosave` hook 管理草稿生命周期与 debounce，`utils/publish.ts` 纯函数（`firstImage`/`parseTopics`）承担可测逻辑，草稿箱 `pages/drafts` 复用 `usePagedList` + `PostCard`。

**技术栈：** Taro 4.2.0、React、TypeScript、bun、Zustand、vitest。测试运行 `bun run test`（vitest），类型校验 `bunx tsc --noEmit`，编译 `bun run build:weapp`。

## 全局约束（Global Constraints）

以下约束是每个任务的隐含要求，值逐字取自 Design Doc / 现有代码：

- **API 契约（Design Doc §6）**：`CreatePostBody = { title: string; content: string; cover?: string; status?: PostStatus; images?: string[]; topics?: string[] }`，`UpdatePostBody = Partial<CreatePostBody>`。移除错误的 `imageUrls`/`topicIds`。
- **PostStatus**：`'DRAFT' | 'PUBLISHED'`（`src/types/api.ts`）。
- **编辑器接入（Design Doc §2）**：微信官方 `<Editor id="editor">`；`onReady` 里 `Taro.createSelectorQuery().select('#editor').context(res => ...)` 拿 `EditorContext`；`ctx.format(name, value)` 格式化；`ctx.getContents({ success: ({ html, text }) => ... })` 异步取内容；`ctx.setContents({ html })` 回填；`ctx.insertImage({ src })` 插图。
- **失焦防护**：工具栏按钮外层用 `catchtouchstart`（Taro 中为 `onTouchStart` + 阻止默认，wxml 属性名 `catchtouchstart`）阻止 editor 失焦丢光标。
- **图片上传**：`Taro.chooseImage` → `uploadApi.uploadImage(filePath)` 返回 `{ url }` → `ctx.insertImage({ src: url, width: '100%' })`。
- **debounce 间隔**：`1800ms`。
- **空草稿防护**：仅当 `title` 非空 OR `text` 非空 才触发首次 `create`。
- **编辑已发布帖子**：`update` 不传 `status`，保持 `PUBLISHED`。
- **未登录拦截**：进入发布页校验 `useAuthStore.getState().isLogin`，未登录触发 `login()`，未登录不得提交。
- **设计 token**：温柔治愈系。主题色 `#F0A868`(peach)、`#E4A9BE`、bg `#FAF6F0`；类名沿用 Tailwind 原子类（`bg-peach`/`text-ink`/`text-ink-sub`/`rounded-pill`/`rounded-card`/`shadow-soft`/`press`）。
- **测试位置**：纯函数测试放 `src/utils/__tests__/*.test.ts`，风格 `import { describe, it, expect } from 'vitest'`。
- **提交**：每个任务结束一次 `git commit`，conventional commits 格式，不积攒。

archived-with: 2026-07-12-article-publish-richtext
---

## 文件结构

**新建：**
- `src/utils/publish.ts` — 纯函数：`firstImage(html)` 取正文首图、`parseTopics(input)` 话题解析。
- `src/utils/__tests__/publish.test.ts` — 上述纯函数单测。
- `src/components/RichEditor/index.tsx` — 富文本编辑器封装（Editor + EditorContext + 分层工具栏），命令式 ref 暴露 `getContents`/`setContents`/`insertImage`。
- `src/components/RichEditor/EditorToolbar.tsx` — 常驻工具栏一行。
- `src/components/RichEditor/MorePanel.tsx` — 「更多」折叠面板。
- `src/components/RichEditor/index.scss` — 编辑器与工具栏样式。
- `src/hooks/useDraftAutosave.ts` — 草稿自动保存 hook（draftId 生命周期 + debounce + 竞态）。
- `src/pages/drafts/index.tsx` — 草稿箱页。
- `src/pages/drafts/index.config.ts` — 草稿箱页配置。

**修改：**
- `src/services/api/posts.ts` — 契约修正 `CreatePostBody`/`UpdatePostBody`。
- `src/pages/publish/index.tsx` — 从占位改为完整发布/编辑页。
- `src/app.config.ts` — 注册 `pages/drafts/index` 路由。
- `src/pages/profile/index.tsx` — 个人中心挂草稿箱入口。
- `src/components/index.ts` — 导出 `RichEditor`（若存在 barrel）。

archived-with: 2026-07-12-article-publish-richtext
---

## Task 1: API 契约修正与话题/首图纯函数

契约修正与两个纯函数无相互依赖，但同属「地基类型层」，一个 reviewer 可整体验收；纯函数走 TDD。

**Files:**
- Modify: `src/services/api/posts.ts:4-12`
- Create: `src/utils/publish.ts`
- Test: `src/utils/__tests__/publish.test.ts`

**Interfaces:**
- Consumes: `extractImageUrls(html: string): string[]`（`src/utils/richtext.ts`，已存在）。
- Produces:
  - `CreatePostBody = { title: string; content: string; cover?: string; status?: PostStatus; images?: string[]; topics?: string[] }`
  - `UpdatePostBody = Partial<CreatePostBody>`
  - `firstImage(html: string): string` — 正文首图 URL，无图返回 `''`
  - `parseTopics(input: string): string[]` — 从文本收集 `#话题` 去重话题名数组

- [x] **Step 1: 修正 posts.ts 契约类型**

将 `src/services/api/posts.ts` 顶部接口替换为：

```ts
import { authRequest } from '../authRequest'
import type { Post, Paginated, PostStatus } from '../../types/api'

export interface CreatePostBody {
  title: string
  content: string // 富文本 HTML
  cover?: string // 正文首图
  status?: PostStatus // DRAFT(默认) | PUBLISHED
  images?: string[] // 图片 URL 数组，对齐后端 images
  topics?: string[] // 话题名数组，对齐后端 topics（非 id）
}

export type UpdatePostBody = Partial<CreatePostBody>
```

`postsApi` 对象（`create`/`update`/`publish`/`findDrafts`/`remove`/`findOne`）签名保持不变——它们已引用 `CreatePostBody`/`UpdatePostBody`，改类型即生效。

- [x] **Step 2: 写 publish.ts 纯函数的失败测试**

创建 `src/utils/__tests__/publish.test.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { firstImage, parseTopics } from '../publish'

describe('firstImage', () => {
  it('多图取首图', () => {
    const html = '<p>hi</p><img src="https://a.com/1.png" /><img src="https://a.com/2.jpg">'
    expect(firstImage(html)).toBe('https://a.com/1.png')
  })
  it('单图取该图', () => {
    expect(firstImage('<img src="https://a.com/x.png">')).toBe('https://a.com/x.png')
  })
  it('无图返回空串', () => {
    expect(firstImage('<p>纯文本</p>')).toBe('')
    expect(firstImage('')).toBe('')
  })
})

describe('parseTopics', () => {
  it('单个话题', () => {
    expect(parseTopics('今天好累 #摆烂')).toEqual(['摆烂'])
  })
  it('多个话题', () => {
    expect(parseTopics('#摆烂 #周末 #躺平')).toEqual(['摆烂', '周末', '躺平'])
  })
  it('去重', () => {
    expect(parseTopics('#摆烂 又 #摆烂')).toEqual(['摆烂'])
  })
  it('无话题返回空数组', () => {
    expect(parseTopics('普通文本没有标签')).toEqual([])
    expect(parseTopics('')).toEqual([])
  })
})
```

- [x] **Step 3: 运行测试确认失败**

Run: `bun run test src/utils/__tests__/publish.test.ts`
Expected: FAIL，报错 `Cannot find module '../publish'` 或 `firstImage is not a function`。

- [x] **Step 4: 实现 publish.ts**

创建 `src/utils/publish.ts`：

```ts
import { extractImageUrls } from './richtext'

/** 封面取正文首图（复用 richtext.extractImageUrls），无图返回空串 */
export function firstImage(html: string): string {
  return extractImageUrls(html)[0] ?? ''
}

/** 话题解析：从输入文本收集 #话题 → 去重后的话题名数组 */
export function parseTopics(input: string): string[] {
  const re = /#([^\s#]+)/g
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(input)) !== null) {
    if (!out.includes(m[1])) out.push(m[1])
  }
  return out
}
```

- [x] **Step 5: 运行测试确认通过**

Run: `bun run test src/utils/__tests__/publish.test.ts`
Expected: PASS（7 个用例全绿）。

- [x] **Step 6: 类型校验**

Run: `bunx tsc --noEmit`
Expected: 无错误（契约修正后无引用 `imageUrls`/`topicIds` 的旧代码）。若报错定位到引用旧字段处并修正。

- [x] **Step 7: 提交**

```bash
git add src/services/api/posts.ts src/utils/publish.ts src/utils/__tests__/publish.test.ts
git commit -m "feat(publish): 修正 CreatePostBody 契约 + firstImage/parseTopics 纯函数"
```

archived-with: 2026-07-12-article-publish-richtext
---

## Task 2: RichEditor 富文本编辑器组件

封装微信 `<editor>` + `EditorContext` + 分层工具栏（常驻 `EditorToolbar` + 折叠 `MorePanel`）+ 图片插入。命令式 ref 供发布页取内容/回填。工具栏、面板、图片插入是同一交付单元（无编辑器则无从工具栏调用）。

**Files:**
- Create: `src/components/RichEditor/index.tsx`
- Create: `src/components/RichEditor/EditorToolbar.tsx`
- Create: `src/components/RichEditor/MorePanel.tsx`
- Create: `src/components/RichEditor/index.scss`
- Modify: `src/components/index.ts`（若存在 barrel 导出）

**Interfaces:**
- Consumes: `uploadApi.uploadImage(filePath): Promise<{ url: string }>`（`src/services/api/upload.ts`）。
- Produces（供 Task 3/4 使用）：
  - `RichEditorHandle` ref 接口：
    - `getContents(): Promise<{ html: string; text: string }>`
    - `setContents(html: string): void`
    - `insertImage(src: string): void`
  - `RichEditor` 组件 props：`{ placeholder?: string; onInput?: () => void }`（`onInput` 在编辑器内容变化时触发，供自动保存）。

- [x] **Step 1: 创建 MorePanel 折叠面板**

创建 `src/components/RichEditor/MorePanel.tsx`。选值型格式用预设控件（预设色板取设计 token 主题色、S/M/L 字号）：

```tsx
import { View, Text } from '@tarojs/components'

// 预设色板（设计 token 主题色）
const COLORS = ['#F0A868', '#E4A9BE', '#8FBF9F', '#7FA9C9', '#C9A9E4', '#8A7F76', '#333333']
// S/M/L 字号映射
const FONT_SIZES: Array<{ label: string; value: string }> = [
  { label: 'S', value: '14px' },
  { label: 'M', value: '17px' },
  { label: 'L', value: '20px' },
]

interface Props {
  onFormat: (name: string, value?: string) => void
}

// catchtouchstart 阻止 editor 失焦丢光标
const stop = (e: any) => e.stopPropagation?.()

export default function MorePanel({ onFormat }: Props) {
  return (
    <View className='more-panel bg-card' catchTouchStart={stop}>
      {/* 行内格式 */}
      <View className='panel-row'>
        <View className='panel-btn press' onClick={() => onFormat('italic')}>
          <Text className='panel-btn-txt'>斜体</Text>
        </View>
        <View className='panel-btn press' onClick={() => onFormat('underline')}>
          <Text className='panel-btn-txt'>下划线</Text>
        </View>
        <View className='panel-btn press' onClick={() => onFormat('strike')}>
          <Text className='panel-btn-txt'>删除线</Text>
        </View>
        <View className='panel-btn press' onClick={() => onFormat('list', 'ordered')}>
          <Text className='panel-btn-txt'>有序</Text>
        </View>
      </View>
      {/* 对齐 / 引用 / 分割线 / 缩进 */}
      <View className='panel-row'>
        <View className='panel-btn press' onClick={() => onFormat('align', 'left')}>
          <Text className='panel-btn-txt'>左</Text>
        </View>
        <View className='panel-btn press' onClick={() => onFormat('align', 'center')}>
          <Text className='panel-btn-txt'>中</Text>
        </View>
        <View className='panel-btn press' onClick={() => onFormat('align', 'right')}>
          <Text className='panel-btn-txt'>右</Text>
        </View>
        <View className='panel-btn press' onClick={() => onFormat('blockquote')}>
          <Text className='panel-btn-txt'>引用</Text>
        </View>
        <View className='panel-btn press' onClick={() => onFormat('indent', '+1')}>
          <Text className='panel-btn-txt'>缩进</Text>
        </View>
      </View>
      {/* 字号 S/M/L */}
      <View className='panel-row'>
        <Text className='panel-label text-ink-sub'>字号</Text>
        {FONT_SIZES.map((f) => (
          <View key={f.value} className='panel-btn press' onClick={() => onFormat('fontSize', f.value)}>
            <Text className='panel-btn-txt'>{f.label}</Text>
          </View>
        ))}
      </View>
      {/* 颜色预设色板 */}
      <View className='panel-row'>
        <Text className='panel-label text-ink-sub'>文字</Text>
        {COLORS.map((c) => (
          <View
            key={`fg-${c}`}
            className='color-dot press'
            style={{ background: c }}
            onClick={() => onFormat('color', c)}
          />
        ))}
      </View>
      {/* 背景色预设色板 */}
      <View className='panel-row'>
        <Text className='panel-label text-ink-sub'>背景</Text>
        {COLORS.map((c) => (
          <View
            key={`bg-${c}`}
            className='color-dot press'
            style={{ background: c }}
            onClick={() => onFormat('backgroundColor', c)}
          />
        ))}
      </View>
    </View>
  )
}
```

- [x] **Step 2: 创建 EditorToolbar 常驻工具栏**

创建 `src/components/RichEditor/EditorToolbar.tsx`：

```tsx
import { View, Text } from '@tarojs/components'

interface Props {
  onFormat: (name: string, value?: string) => void
  onInsertImage: () => void
  onInsertTopic: () => void
  onToggleMore: () => void
  moreOpen: boolean
  uploading: boolean
}

const stop = (e: any) => e.stopPropagation?.()

export default function EditorToolbar({
  onFormat,
  onInsertImage,
  onInsertTopic,
  onToggleMore,
  moreOpen,
  uploading,
}: Props) {
  return (
    <View className='editor-toolbar bg-card' catchTouchStart={stop}>
      <View className='tool-btn press' onClick={() => onFormat('bold')}>
        <Text className='tool-txt font-bold'>B</Text>
      </View>
      <View className='tool-btn press' onClick={() => onFormat('header', 'H2')}>
        <Text className='tool-txt'>H2</Text>
      </View>
      <View className='tool-btn press' onClick={() => onFormat('list', 'bullet')}>
        <Text className='tool-txt'>• 列表</Text>
      </View>
      <View className={`tool-btn press ${uploading ? 'opacity-50' : ''}`} onClick={onInsertImage}>
        <Text className='tool-txt'>{uploading ? '上传…' : '图片'}</Text>
      </View>
      <View className='tool-btn press' onClick={onInsertTopic}>
        <Text className='tool-txt'>#话题</Text>
      </View>
      <View className='tool-btn press' onClick={onToggleMore}>
        <Text className='tool-txt'>{moreOpen ? '收起' : '更多'}</Text>
      </View>
    </View>
  )
}
```

- [x] **Step 3: 创建 RichEditor 主组件（含 EditorContext + ref）**

创建 `src/components/RichEditor/index.tsx`。用 `forwardRef` + `useImperativeHandle` 暴露命令式接口；`onReady` 拿 `EditorContext`；图片插入走 chooseImage → uploadApi → insertImage：

```tsx
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { View } from '@tarojs/components'
import { Editor } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { uploadApi } from '../../services/api'
import { useUiStore } from '../../store/ui'
import EditorToolbar from './EditorToolbar'
import MorePanel from './MorePanel'
import './index.scss'

export interface RichEditorHandle {
  getContents: () => Promise<{ html: string; text: string }>
  setContents: (html: string) => void
  insertImage: (src: string) => void
}

interface Props {
  placeholder?: string
  onInput?: () => void
  onInsertTopic?: () => void
}

const RichEditor = forwardRef<RichEditorHandle, Props>(function RichEditor(
  { placeholder = '记录此刻的摆烂…', onInput, onInsertTopic },
  ref,
) {
  const showToast = useUiStore((s) => s.showToast)
  const ctxRef = useRef<any>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  const onEditorReady = () => {
    Taro.createSelectorQuery()
      .select('#editor')
      .context((res) => {
        ctxRef.current = res.context
      })
      .exec()
  }

  const format = (name: string, value?: string) => {
    ctxRef.current?.format(name, value)
  }

  const insertImage = (src: string) => {
    ctxRef.current?.insertImage({ src, width: '100%' })
  }

  const chooseAndInsert = async () => {
    if (uploading) return
    try {
      const res = await Taro.chooseImage({ count: 1 })
      const filePath = res.tempFilePaths?.[0]
      if (!filePath) return
      setUploading(true)
      const { url } = await uploadApi.uploadImage(filePath)
      insertImage(url)
      onInput?.()
    } catch {
      showToast('图片上传失败', 'error')
    } finally {
      setUploading(false)
    }
  }

  useImperativeHandle(ref, () => ({
    getContents: () =>
      new Promise((resolve) => {
        if (!ctxRef.current) return resolve({ html: '', text: '' })
        ctxRef.current.getContents({
          success: ({ html, text }: { html: string; text: string }) => resolve({ html, text }),
          fail: () => resolve({ html: '', text: '' }),
        })
      }),
    setContents: (html: string) => ctxRef.current?.setContents({ html }),
    insertImage,
  }))

  return (
    <View className='rich-editor'>
      <EditorToolbar
        onFormat={format}
        onInsertImage={chooseAndInsert}
        onInsertTopic={() => onInsertTopic?.()}
        onToggleMore={() => setMoreOpen((v) => !v)}
        moreOpen={moreOpen}
        uploading={uploading}
      />
      {moreOpen && <MorePanel onFormat={format} />}
      <Editor
        id='editor'
        className='editor-body'
        placeholder={placeholder}
        onReady={onEditorReady}
        onInput={() => onInput?.()}
      />
    </View>
  )
})

export default RichEditor
```

- [x] **Step 4: 创建样式 index.scss**

创建 `src/components/RichEditor/index.scss`（温柔治愈系，克制间距）：

```scss
.rich-editor {
  display: flex;
  flex-direction: column;
}
.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 12rpx 8rpx;
  border-radius: 20rpx;
  .tool-btn {
    padding: 8rpx 16rpx;
    margin: 4rpx;
    border-radius: 12rpx;
    background: #faf6f0;
    .tool-txt {
      font-size: 26rpx;
      color: #4a4038;
    }
  }
}
.more-panel {
  margin-top: 8rpx;
  padding: 12rpx;
  border-radius: 20rpx;
  .panel-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    margin-bottom: 8rpx;
  }
  .panel-label {
    font-size: 24rpx;
    margin-right: 12rpx;
  }
  .panel-btn {
    padding: 6rpx 14rpx;
    margin: 4rpx;
    border-radius: 10rpx;
    background: #faf6f0;
    .panel-btn-txt {
      font-size: 24rpx;
      color: #4a4038;
    }
  }
  .color-dot {
    width: 44rpx;
    height: 44rpx;
    border-radius: 50%;
    margin: 4rpx 8rpx;
  }
}
.editor-body {
  min-height: 480rpx;
  margin-top: 16rpx;
  padding: 16rpx;
  border-radius: 20rpx;
  background: #ffffff;
  font-size: 30rpx;
  line-height: 1.7;
}
```

- [x] **Step 5: 导出 RichEditor（如有 barrel）**

若 `src/components/index.ts` 存在，追加导出行：

```ts
export { default as RichEditor } from './RichEditor'
export type { RichEditorHandle } from './RichEditor'
```

（若无 barrel 文件则跳过，发布页直接从 `../../components/RichEditor` 引入。）

- [x] **Step 6: 类型校验**

Run: `bunx tsc --noEmit`
Expected: 无错误。若 `Editor`/`onReady`/`catchTouchStart` 报类型问题，用 `as any` 收敛第三方组件属性（微信 editor 属性 Taro 类型可能不全），保持编译通过。

- [x] **Step 7: 提交**

```bash
git add src/components/RichEditor src/components/index.ts
git commit -m "feat(publish): RichEditor 富文本编辑器（EditorContext + 分层工具栏 + 图片插入）"
```

archived-with: 2026-07-12-article-publish-richtext
---

## Task 3: 发布页 pages/publish（新建 + 编辑双态）

改写占位页为完整发布/编辑页：标题 Input + RichEditor + 话题输入 + 未登录拦截 + 发布 + 编辑回填。`router.params.id` 区分新建/编辑，编辑已发布帖子 `update` 不传 status。

**Files:**
- Modify: `src/pages/publish/index.tsx`
- Modify: `src/pages/publish/index.config.ts`（如需调标题，可保留）

**Interfaces:**
- Consumes:
  - `RichEditor` + `RichEditorHandle`（Task 2）
  - `firstImage(html)`、`parseTopics(input)`（Task 1）
  - `postsApi.create/update/publish/findOne`（Task 1 契约）
  - `useAuthStore`、`login()`（`src/services/auth.ts`）
- Produces: 发布/编辑页；供 Task 4 挂载 `useDraftAutosave`（本任务先做手动发布路径，自动保存在 Task 4 接入）。

- [x] **Step 1: 改写 publish/index.tsx —— 状态、登录拦截、载入回填**

替换 `src/pages/publish/index.tsx` 全文：

```tsx
import { useEffect, useRef, useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro, { getCurrentInstance } from '@tarojs/taro'
import RichEditor, { RichEditorHandle } from '../../components/RichEditor'
import { firstImage, parseTopics } from '../../utils/publish'
import { postsApi } from '../../services/api'
import { useAuthStore } from '../../store/auth'
import { login } from '../../services/auth'
import { useUiStore } from '../../store/ui'
import type { PostStatus } from '../../types/api'

export default function Publish() {
  const showToast = useUiStore((s) => s.showToast)
  const editorRef = useRef<RichEditorHandle>(null)
  const [title, setTitle] = useState('')
  const [topicInput, setTopicInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // 编辑态：url ?id= 存在
  const idParam = getCurrentInstance().router?.params?.id
  const editingId = idParam ? Number(idParam) : null
  // 载入的原帖状态：编辑已发布帖子时用于保持 PUBLISHED
  const origStatusRef = useRef<PostStatus | null>(null)

  // 未登录拦截：进入即校验
  useEffect(() => {
    if (!useAuthStore.getState().isLogin) {
      login().catch((e: any) => {
        showToast(e?.message || '请先登录', 'error')
      })
    }
  }, [showToast])

  // 编辑态载入回填
  useEffect(() => {
    if (!editingId) return
    postsApi
      .findOne(editingId)
      .then((p) => {
        setTitle(p.title || '')
        origStatusRef.current = p.status
        setTopicInput((p.topics || []).map((t) => `#${t.name}`).join(' '))
        // 编辑器 ready 后回填（延迟确保 ctx 就绪）
        setTimeout(() => editorRef.current?.setContents(p.content || ''), 300)
      })
      .catch(() => showToast('载入失败', 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId])

  // ...（发布逻辑见下一步）
  return null
}
```

- [x] **Step 2: 实现发布逻辑 + 渲染 UI**

在 `return null` 之前加入 `submit`，并替换 `return`：

```tsx
  const submit = async () => {
    if (submitting) return
    if (!useAuthStore.getState().isLogin) {
      showToast('请先登录', 'error')
      return
    }
    const { html, text } = await editorRef.current!.getContents()
    if (!title.trim() || !text.trim()) {
      showToast('标题和正文不能为空', 'info')
      return
    }
    const topics = parseTopics(`${title} ${topicInput}`)
    const images = extractImagesInOrder(html)
    const cover = firstImage(html)
    setSubmitting(true)
    try {
      if (editingId) {
        // 编辑态：已发布不传 status 保持 PUBLISHED；草稿更新后再发布
        if (origStatusRef.current === 'PUBLISHED') {
          await postsApi.update(editingId, { title, content: html, cover, images, topics })
        } else {
          await postsApi.update(editingId, { title, content: html, cover, images, topics })
          await postsApi.publish(editingId)
        }
        showToast('已保存', 'success')
        Taro.navigateBack()
      } else {
        const post = await postsApi.create({
          title,
          content: html,
          cover,
          images,
          topics,
          status: 'PUBLISHED',
        })
        showToast('发布成功', 'success')
        Taro.redirectTo({ url: `/pages/detail/index?id=${post.id}` })
      }
    } catch {
      showToast('发布失败，请重试', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className='min-h-screen bg-bg px-6 pt-6'>
      <Input
        className='text-xl text-ink font-bold py-3'
        value={title}
        placeholder='起个标题吧～'
        onInput={(e) => setTitle(e.detail.value)}
      />
      <RichEditor ref={editorRef} />
      <View className='mt-4'>
        <Text className='text-xs text-ink-sub'>话题（用 #话题 形式，空格分隔）</Text>
        <Input
          className='mt-2 text-base text-ink'
          value={topicInput}
          placeholder='#摆烂 #周末'
          onInput={(e) => setTopicInput(e.detail.value)}
        />
      </View>
      <View
        className={`press bg-peach rounded-pill py-3 mt-8 flex justify-center items-center ${submitting ? 'opacity-50' : ''}`}
        onClick={submit}
      >
        <Text className='text-base text-card'>
          {submitting ? '提交中…' : editingId ? '保存' : '发布'}
        </Text>
      </View>
    </View>
  )
```

- [x] **Step 3: 添加 images 保序辅助函数**

Design Doc §6 要求 `images` 按正文图片出现顺序整理。在 `src/utils/publish.ts` 追加导出，并在 publish 页顶部 `import { firstImage, parseTopics, extractImagesInOrder } from '../../utils/publish'`：

```ts
/** images 保序：按正文 HTML 中图片出现顺序返回全部图片 URL */
export function extractImagesInOrder(html: string): string[] {
  return extractImageUrls(html)
}
```

（`extractImageUrls` 已保序，直接复用；此导出让发布页语义清晰。）

- [x] **Step 4: 类型校验**

Run: `bunx tsc --noEmit`
Expected: 无错误。若 `getCurrentInstance().router` 可空报错，已用可选链 `?.` 处理。

- [x] **Step 5: 编译验证**

Run: `bun run build:weapp`
Expected: 编译成功，无报错。

- [x] **Step 6: 提交**

```bash
git add src/pages/publish/index.tsx src/utils/publish.ts
git commit -m "feat(publish): 发布页新建/编辑双态 + 未登录拦截 + 封面取首图"
```

archived-with: 2026-07-12-article-publish-richtext
---

## Task 4: 草稿自动保存 useDraftAutosave

新增 hook 管理 draftId 生命周期、debounce 1800ms、竞态处理、保存状态字；在发布页接入，新增 SaveStatus 角落状态字。

**Files:**
- Create: `src/hooks/useDraftAutosave.ts`
- Modify: `src/pages/publish/index.tsx`

**Interfaces:**
- Consumes: `postsApi.create/update`（Task 1）。
- Produces:
  - `type SaveStatus = 'idle' | 'saving' | 'saved'`
  - `useDraftAutosave(opts: { editingId: number | null; getSnapshot: () => { title: string; html: string; text: string; topics: string[] } }): { draftId: number | null; status: SaveStatus; flush: () => Promise<void>; cancel: () => void }`

- [x] **Step 1: 实现 useDraftAutosave hook**

创建 `src/hooks/useDraftAutosave.ts`。实现 draftId 生命周期状态机（Design Doc §4）：首次 `create(status:DRAFT)` 拿 id，后续 `update(draftId)`；debounce 1800ms；空白不 create；create 进行中标 dirty 完成补 update；`flush`/`cancel` 供发布/离开兜底：

```ts
import { useCallback, useEffect, useRef, useState } from 'react'
import { postsApi } from '../services/api'

export type SaveStatus = 'idle' | 'saving' | 'saved'

interface Snapshot {
  title: string
  html: string
  text: string
  topics: string[]
}

interface Opts {
  editingId: number | null
  getSnapshot: () => Snapshot
}

const DEBOUNCE_MS = 1800

export function useDraftAutosave({ editingId, getSnapshot }: Opts) {
  // 编辑已有帖子时 draftId 即该帖 id；新建态从 null 起
  const [draftId, setDraftId] = useState<number | null>(editingId)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const draftIdRef = useRef<number | null>(editingId)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const creatingRef = useRef(false) // 首次 create 进行中
  const dirtyRef = useRef(false) // create 期间又有变化

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // 真正执行一次保存（create 或 update）
  const persist = useCallback(async () => {
    const snap = getSnapshot()
    // 空草稿防护：新建态 title 空 AND text 空则不 create
    if (draftIdRef.current === null && !snap.title.trim() && !snap.text.trim()) return
    const body = {
      title: snap.title,
      content: snap.html,
      topics: snap.topics,
    }
    setStatus('saving')
    try {
      if (draftIdRef.current === null) {
        if (creatingRef.current) {
          dirtyRef.current = true
          return
        }
        creatingRef.current = true
        const post = await postsApi.create({ ...body, status: 'DRAFT' })
        draftIdRef.current = post.id
        setDraftId(post.id)
        creatingRef.current = false
        // create 期间有新变化：补一次 update
        if (dirtyRef.current) {
          dirtyRef.current = false
          const s2 = getSnapshot()
          await postsApi.update(post.id, { title: s2.title, content: s2.html, topics: s2.topics })
        }
      } else {
        await postsApi.update(draftIdRef.current, body)
      }
      setStatus('saved')
    } catch {
      setStatus('idle')
    }
  }, [getSnapshot])

  // 外部调用：内容变化时触发 debounce
  const schedule = useCallback(() => {
    cancel()
    timerRef.current = setTimeout(() => {
      void persist()
    }, DEBOUNCE_MS)
  }, [cancel, persist])

  // flush：取消 pending，立即保存并等待完成（发布/离开兜底）
  const flush = useCallback(async () => {
    cancel()
    await persist()
  }, [cancel, persist])

  // 卸载清理
  useEffect(() => cancel, [cancel])

  return { draftId, status, schedule, flush, cancel }
}
```

> 说明：hook 额外暴露 `schedule`（内容变化调用它启动 debounce）。发布页在 RichEditor `onInput` 与标题/话题变化时调用 `schedule()`。

- [x] **Step 2: 发布页接入 useDraftAutosave + SaveStatus 状态字**

修改 `src/pages/publish/index.tsx`：引入 hook，`getSnapshot` 从当前 title/topicInput + 编辑器内容组装，绑定 `onInput`，发布前 `flush`，`useUnload` 兜底，渲染 SaveStatus。

顶部新增导入：

```tsx
import { useUnload } from '@tarojs/taro'
import { useDraftAutosave } from '../../hooks/useDraftAutosave'
```

在组件内、`submit` 之前加入：

```tsx
  // 供自动保存取快照（正文异步取，缓存最近一次 getContents 结果）
  const lastHtmlRef = useRef('')
  const lastTextRef = useRef('')

  const draft = useDraftAutosave({
    editingId,
    getSnapshot: () => ({
      title,
      html: lastHtmlRef.current,
      text: lastTextRef.current,
      topics: parseTopics(`${title} ${topicInput}`),
    }),
  })

  // 编辑器内容变化：取内容缓存后触发 debounce 保存
  const onEditorInput = async () => {
    const { html, text } = await editorRef.current!.getContents()
    lastHtmlRef.current = html
    lastTextRef.current = text
    draft.schedule()
  }

  // 标题/话题变化也触发保存
  useEffect(() => {
    if (title || topicInput) draft.schedule()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, topicInput])

  // 离开页面兜底 flush
  useUnload(() => {
    void draft.flush()
  })
```

`submit` 内在取内容后、正式提交前，先 `draft.cancel()` 并 `await draft.flush()`（发布前 cancel pending + 等 settle + 串行提交），把编辑态草稿 id 统一用 `draft.draftId`：

```tsx
  const submit = async () => {
    if (submitting) return
    if (!useAuthStore.getState().isLogin) {
      showToast('请先登录', 'error')
      return
    }
    const { html, text } = await editorRef.current!.getContents()
    if (!title.trim() || !text.trim()) {
      showToast('标题和正文不能为空', 'info')
      return
    }
    lastHtmlRef.current = html
    lastTextRef.current = text
    draft.cancel()
    await draft.flush() // 等 pending 自动保存 settle，串行
    const topics = parseTopics(`${title} ${topicInput}`)
    const images = extractImagesInOrder(html)
    const cover = firstImage(html)
    const targetId = editingId ?? draft.draftId
    setSubmitting(true)
    try {
      if (targetId) {
        if (origStatusRef.current === 'PUBLISHED') {
          await postsApi.update(targetId, { title, content: html, cover, images, topics })
        } else {
          await postsApi.update(targetId, { title, content: html, cover, images, topics })
          await postsApi.publish(targetId)
        }
        showToast(editingId ? '已保存' : '发布成功', 'success')
        if (editingId) Taro.navigateBack()
        else Taro.redirectTo({ url: `/pages/detail/index?id=${targetId}` })
      } else {
        const post = await postsApi.create({
          title,
          content: html,
          cover,
          images,
          topics,
          status: 'PUBLISHED',
        })
        showToast('发布成功', 'success')
        Taro.redirectTo({ url: `/pages/detail/index?id=${post.id}` })
      }
    } catch {
      showToast('发布失败，请重试', 'error')
    } finally {
      setSubmitting(false)
    }
  }
```

将 `<RichEditor ref={editorRef} />` 改为绑定 `onInput`：

```tsx
      <RichEditor ref={editorRef} onInput={onEditorInput} />
```

在标题 Input 上方或页面角落渲染 SaveStatus：

```tsx
      <View className='flex justify-end py-1'>
        <Text className='text-xs text-ink-sub'>
          {draft.status === 'saving' ? '保存中…' : draft.status === 'saved' ? '草稿已保存' : ''}
        </Text>
      </View>
```

- [x] **Step 3: 类型校验**

Run: `bunx tsc --noEmit`
Expected: 无错误。

- [x] **Step 4: 编译验证**

Run: `bun run build:weapp`
Expected: 编译成功。

- [x] **Step 5: 提交**

```bash
git add src/hooks/useDraftAutosave.ts src/pages/publish/index.tsx
git commit -m "feat(publish): 草稿自动保存 useDraftAutosave（draftId 生命周期 + debounce + 竞态 + 保存状态字）"
```

archived-with: 2026-07-12-article-publish-richtext
---

## Task 5: 草稿箱页 pages/drafts

新增草稿箱页（`usePagedList(postsApi.findDrafts)` + `PostCard` + 空态），点击继续编辑，删除二次确认。注册路由，个人中心挂入口。

**Files:**
- Create: `src/pages/drafts/index.tsx`
- Create: `src/pages/drafts/index.config.ts`
- Modify: `src/app.config.ts:2-8`（pages 数组加 `pages/drafts/index`）
- Modify: `src/pages/profile/index.tsx`（个人中心加草稿箱入口）

**Interfaces:**
- Consumes: `usePagedList`、`postsApi.findDrafts(page)`、`postsApi.remove(id)`、`PostCard`。
- Produces: 草稿箱页，入口路径 `/pages/drafts/index`。

- [x] **Step 1: 注册路由**

修改 `src/app.config.ts`，在 `pages` 数组追加（放在 `pages/profile-edit/index` 后）：

```ts
    'pages/profile-edit/index',
    'pages/drafts/index',
```

- [x] **Step 2: 创建草稿箱页配置**

创建 `src/pages/drafts/index.config.ts`：

```ts
export default definePageConfig({
  navigationBarTitleText: '草稿箱',
})
```

- [x] **Step 3: 创建草稿箱页**

创建 `src/pages/drafts/index.tsx`。参考 profile 页 `usePagedList` + `PostCard` + 空态模式；点击进 `publish?id=`；删除二次确认后 `remove` + 本地移除：

```tsx
import { useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { PostCard, SkeletonList } from '../../components'
import { usePagedList } from '../../hooks/usePagedList'
import { postsApi } from '../../services/api'
import { useUiStore } from '../../store/ui'
import type { Post } from '../../types/api'

export default function Drafts() {
  const showToast = useUiStore((s) => s.showToast)
  const { list, loading, hasMore, loadMore, reload, setList } = usePagedList<Post>((page) =>
    postsApi.findDrafts(page),
  )

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openDraft = (id: number) => {
    Taro.navigateTo({ url: `/pages/publish/index?id=${id}` })
  }

  const removeDraft = async (id: number) => {
    const { confirm } = await Taro.showModal({ title: '删除草稿', content: '确定删除这篇草稿吗？' })
    if (!confirm) return
    try {
      await postsApi.remove(id)
      setList((prev) => prev.filter((p) => p.id !== id))
      showToast('已删除', 'success')
    } catch {
      showToast('删除失败', 'error')
    }
  }

  return (
    <ScrollView
      scrollY
      className='bg-bg'
      style={{ height: '100vh' }}
      onScrollToLower={() => loadMore()}
      lowerThreshold={80}
    >
      <View className='px-6 pt-6 pb-8'>
        {loading && list.length === 0 && <SkeletonList count={3} />}
        {!loading && list.length === 0 && (
          <View className='bg-card rounded-card shadow-soft p-6 flex flex-col items-center'>
            <View className='py-6'>
              <Text className='text-sm text-ink-sub'>还没有草稿～</Text>
            </View>
          </View>
        )}
        {list.map((post) => (
          <View key={post.id}>
            <View onClick={() => openDraft(post.id)}>
              <PostCard post={post} />
            </View>
            <View className='flex justify-end px-2 -mt-2 mb-3'>
              <View className='press' onClick={() => removeDraft(post.id)}>
                <Text className='text-xs' style={{ color: '#E4A9BE' }}>删除</Text>
              </View>
            </View>
          </View>
        ))}
        {list.length > 0 && (
          <View className='py-4 flex justify-center items-center'>
            <Text className='text-xs text-ink-sub'>
              {loading ? '加载中…' : hasMore ? '上拉加载更多' : '没有更多了'}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}
```

- [x] **Step 4: 个人中心挂草稿箱入口**

修改 `src/pages/profile/index.tsx`，在资料卡「编辑」按钮附近或 Tab 上方加草稿箱入口。在登录态资料卡内、编辑按钮之后新增一个入口（放在编辑按钮同一行或下方）。具体：把资料卡内的按钮区改为并列编辑 + 草稿箱，或在 Tab 区上方加一行入口。最小侵入方案——在 `{isLogin && (` 的 `<>` 内、`<View className='flex mb-4'>`（Tab 行）之前插入：

```tsx
            <View className='flex mb-4'>
              <View
                className='press bg-card rounded-card shadow-soft px-4 py-2 mr-3'
                onClick={() => Taro.navigateTo({ url: '/pages/drafts/index' })}
              >
                <Text className='text-sm text-ink-sub'>草稿箱</Text>
              </View>
            </View>
```

- [x] **Step 5: 类型校验 + 编译**

Run: `bunx tsc --noEmit && bun run build:weapp`
Expected: 均通过。

- [x] **Step 6: 提交**

```bash
git add src/pages/drafts src/app.config.ts src/pages/profile/index.tsx
git commit -m "feat(drafts): 草稿箱页（分页列表 + 继续编辑 + 删除）+ 个人中心入口"
```

archived-with: 2026-07-12-article-publish-richtext
---

## Task 6: 验证与冒烟

汇总单测、类型、编译，产出真机冒烟清单。

**Files:**
- 无新增；运行验证命令。

- [x] **Step 1: 全量单测**

Run: `bun run test`
Expected: 全部通过，含 `publish.test.ts`（`firstImage` 3 例 + `parseTopics` 4 例）与既有测试。

- [x] **Step 2: 类型校验**

Run: `bunx tsc --noEmit`
Expected: 无错误。

- [x] **Step 3: weapp 编译**

Run: `bun run build:weapp`
Expected: 编译成功，`dist/` 产物生成。

- [x] **Step 4: 真机/开发者工具冒烟清单**

在微信开发者工具或真机逐项验证（Design Doc §8）：

- [x] 富文本编辑：加粗/H2 标题/项目列表常驻工具栏生效
- [x] 「更多」面板：斜体/下划线/删除线/有序列表/对齐/引用/缩进生效
- [x] 预设色板：文字色/背景色应用；S/M/L 字号切换
- [x] 工具栏点击不丢光标（catchtouchstart 生效）
- [x] 图片插入：chooseImage → 上传 → 光标处插图；上传中禁重复
- [x] 话题：`#话题` 收集进 topics 提交
- [x] 封面：含图取首图为 cover；无图 cover 空且可提交
- [x] 发布：标题/正文非空校验；发布成功进详情
- [x] 自动保存：输入 1800ms 后「保存中…→草稿已保存」；纯空白不建草稿
- [x] 竞态：快速输入后立即发布，不产生重复草稿/丢失
- [x] 草稿箱：分页展示、空态、上拉加载
- [x] 草稿箱继续编辑：回填标题/正文/话题
- [x] 删除草稿：二次确认后移除
- [x] 编辑已发布帖子：保存后仍为 PUBLISHED
- [x] 未登录进发布页触发登录，未登录不可提交

- [x] **Step 5: 记录冒烟结果，提交（如有微调）**

若冒烟发现需修复项，按 systematic-debugging 定位后修，随后：

```bash
git add -A
git commit -m "fix(publish): 冒烟修复"
```

若无修复项，本步骤跳过提交。

archived-with: 2026-07-12-article-publish-richtext
---

## 自查（Self-Review）

- **Spec 覆盖：**
  - 富文本编辑器（Task 2）、图片插入（Task 2）、分层工具栏（Task 2）✓
  - 发布帖子/空校验/草稿转发布（Task 3、4）✓
  - 话题标签（Task 1 parseTopics + Task 3 提交）✓
  - 封面自动取首图（Task 1 firstImage + Task 3）✓
  - 编辑已有帖子保持 PUBLISHED（Task 3、4）✓
  - 未登录拦截（Task 3）✓
  - 草稿自动保存/首次创建/后续更新/节流/状态字（Task 4）✓
  - 草稿箱列表/空态（Task 5）✓
  - 继续编辑草稿（Task 5 → Task 3 回填）✓
  - 删除草稿二次确认（Task 5）✓
- **占位扫描：** 无 TBD/TODO；所有代码步骤含完整代码。
- **类型一致性：** `RichEditorHandle`（getContents/setContents/insertImage）跨 Task 2→3→4 一致；`CreatePostBody`/`UpdatePostBody` 全程一致；`SaveStatus`/`useDraftAutosave` 返回 `{ draftId, status, schedule, flush, cancel }` 与发布页调用一致；`firstImage`/`parseTopics`/`extractImagesInOrder` 签名一致。

