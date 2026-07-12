---
comet_change: article-publish-richtext
role: technical-design
canonical_spec: openspec
---

# article-publish-richtext 技术设计

> 深化 `openspec/changes/article-publish-richtext/design.md`。需求与验收场景以 `specs/*/spec.md` 为准。本 Doc 聚焦实现方案、技术风险、测试策略、边界条件。

## 1. 概览

「摆烂随笔」内容闭环收尾：富文本发布。纯前端交付，go-service 帖子 create/update/publish/drafts 契约已就绪。复用 `uploadApi`、`utils/richtext.ts`、`usePagedList`、`PostCard`、`authStore`、设计 token。

```
pages/publish (发布/编辑, tabBar 两用)
  ├─ RichEditor 组件 (Editor + EditorContext)
  │    ├─ EditorToolbar 常驻行 (加粗/标题/列表/图片/#话题/更多)
  │    └─ MorePanel 折叠面板 (斜体/下划线/删除线/颜色/背景/字号/对齐/引用/分割线/缩进)
  ├─ useDraftAutosave hook (draftId 生命周期 + debounce)
  └─ SaveStatus 角落状态字 (保存中…/草稿已保存)
pages/drafts (草稿箱, usePagedList + PostCard)
utils/publish.ts (封面取首图 firstImage / 话题解析 parseTopics — 纯函数可测)
services/api/posts.ts (契约修正)
```

## 2. 编辑器接入（微信官方 editor）

**组件：Taro `Editor`（4.2.0 已导出）**

- `<Editor id="editor" onReady={onEditorReady} placeholder="记录此刻的摆烂…" />`
- `onReady` 里 `Taro.createSelectorQuery().select('#editor').context(res => ctx = res.context)` 拿到 `EditorContext`
- 格式化：`ctx.format(name, value)`（如 `format('bold')`、`format('header','H2')`、`format('color','#F0A868')`）
- 取内容：`ctx.getContents({ success: ({ html, text }) => ... })` → html 存 content，text 用于空判断
- 回填：编辑态用 `ctx.setContents({ html })`

**分层工具栏**

- `EditorToolbar`：常驻一行，高频无参 format（bold / header H2 / list bullet）+ 图片 + #话题 + 「更多」展开钮
- `MorePanel`：点「更多」弹出，分组按钮。选值型用预设控件：
  - 颜色/背景色 → 预设色板（取设计 token 主题色 6-8 个），`format('color', 预设值)`
  - 字号 → S/M/L 三档映射到 `format('fontSize', '14px'|'17px'|'20px')`
  - 对齐 → 左/中/右 `format('align', 'left'|'center'|'right')`
  - 斜体/下划线/删除线/有序列表/缩进/引用/分割线 → 无参或固定值 format
- 工具栏按钮点击前需 `editor` focus 态；点击工具栏不能让 editor 失焦（用 `catchtouchstart` 阻止默认失焦）

**图片插入**

- `Taro.chooseImage` → `uploadApi.uploadImage(filePath)` 取 url → `ctx.insertImage({ src: url, width: '100%' })`
- 上传中禁用重复插入，失败 showToast 保留编辑态

## 3. 发布页双态（tabBar 两用）

- `getCurrentInstance().router.params.id`：无 = 新建态，有 = 编辑态
- 编辑态 `useDidShow`/onReady 后 `postsApi.findOne(id)` 载入 → 回填标题 Input + `ctx.setContents({html})` + 话题
- 已发布帖子（status=PUBLISHED）编辑保存走 `update`，**不传 status**，保持 PUBLISHED
- 草稿编辑保存走 `update(draftId)`；点发布走 `publish(draftId)`
- 未登录：进入页面 `authStore.isLogin` 校验，未登录触发 `login()`，失败不可编辑提交

**tabBar 两用副作用**：navigateTo 打开 publish?id= 时底部「发布」tab 会高亮，接受此体验取舍。

## 4. 草稿自动保存（useDraftAutosave）

**draftId 生命周期状态机**

```
       新建态 draftId=null
            │  用户输入 (title 非空 OR text 非空)
            ▼
     debounce(1800ms) 到期
            │
      draftId==null ? ──yes──> create({...,status:DRAFT}) ──> setDraftId(res.id)
            │no
            ▼
      update(draftId, {...})
            │
     保存中 setStatus('saving') → 成功 setStatus('saved')
```

- **触发**：title/正文变化 → debounce 1800ms。纯空白（title 空 AND text 空）不触发 create
- **保存状态字**：`SaveStatus` 组件读 status（idle/saving/saved），角落小灰字「保存中… / 草稿已保存」
- **竞态处理**：
  - 首次 create 进行中时，后续变化标记 dirty，create 完成后若 dirty 立即补一次 update
  - 点「发布」：先 `cancel()` pending debounce，等待进行中的保存 settle，再串行 publish/update
  - 离开页面 `useUnload`：flush 一次保存（同步兜底）
- **hook 接口**：`useDraftAutosave({ getSnapshot: () => ({title, html, text, topics}) })` 返回 `{ draftId, status, flush, cancel }`

## 5. 纯函数（utils/publish.ts，可单测）

```ts
// 封面取正文首图（复用 richtext.extractImageUrls）
export function firstImage(html: string): string {
  return extractImageUrls(html)[0] ?? ''
}
// 话题解析：从输入文本收集 #话题 → 去重话题名数组
export function parseTopics(input: string): string[] {
  const re = /#([^\s#]+)/g
  const out: string[] = []
  let m; while ((m = re.exec(input))) if (!out.includes(m[1])) out.push(m[1])
  return out
}
```

## 6. 前端契约修正（services/api/posts.ts）

```ts
export interface CreatePostBody {
  title: string
  content: string        // 富文本 HTML
  cover?: string         // 取正文首图
  status?: PostStatus    // DRAFT(默认) | PUBLISHED
  images?: string[]      // 图片 URL 数组（对齐后端 images）
  topics?: string[]      // 话题名数组（对齐后端 topics，非 id）
}
export type UpdatePostBody = Partial<CreatePostBody>
```
移除错误的 `imageUrls`/`topicIds`。`images` 由正文 HTML 中所有图片 URL（`extractImageUrls`）整理，保序。

## 7. 草稿箱（pages/drafts）

- `usePagedList(p => postsApi.findDrafts(p))` + `PostCard` + 空态，入口挂个人中心
- 点击草稿 → `navigateTo /pages/publish/index?id=<草稿id>` 继续编辑
- 删除：二次确认 `Taro.showModal` → `postsApi.remove(id)` → 本地列表移除

## 8. 测试策略

- **单元（vitest）**：`firstImage`（有图/无图/多图取首）、`parseTopics`（单个/多个/去重/无话题）
- **tsc + weapp 编译**
- **真机冒烟**：富文本编辑与分层工具栏、预设色板/字号、图片插入、话题、发布、自动保存（保存状态字）、草稿箱继续编辑/删除、编辑已发布帖子保持状态、未登录拦截

## 9. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 微信 editor 开发者工具支持不完整 | 真机冒烟兜底，getContents 异步回调处理 |
| 工具栏点击致 editor 失焦丢光标 | catchtouchstart 阻止默认失焦 |
| 自动保存产生空草稿 | title/text 非空才 create |
| 节流保存 vs 手动发布竞态 | 发布前 cancel pending + 等 settle + 串行提交 |
| create 进行中的并发编辑丢失 | dirty 标记，create 后补 update |
| 编辑已发布帖子误改状态 | update 不传 status |
| tabBar 页 navigateTo tab 高亮怪 | 接受取舍，编辑体验优先 |
| images 全量替换顺序 | 按正文图片出现顺序整理 |

## 10. 非目标（YAGNI）

不改 go-service；不做定时发布、内容审核、协同编辑、@提及、Markdown 源码模式、连续取色器/任意字号。
