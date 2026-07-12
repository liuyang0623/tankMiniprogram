## Context

「摆烂随笔」内容闭环收尾：富文本发布。复用地基与前三个 change 的设计系统、请求层、鉴权、`uploadApi`、`usePagedList`、`PostCard`、`utils/richtext.ts`。

契约要点（已核对 go-service `internal/posts`，**后端无需改动**）：
- `POST /posts` 接受 `{title, content, cover, status, images:[]string, topics:[]string}`，`status` 默认 DRAFT，可直接传 PUBLISHED
- `PATCH /posts/:id` 部分更新（指针字段），支持改 status；DRAFT→PUBLISHED 自动设 `published_at`；images/topics 全量替换
- `POST /posts/:id/publish` 草稿转发布（已发布再调报错）
- `GET /posts/drafts` 按 author + DRAFT，updated_at 倒序
- `GET /posts/:id` 草稿仅作者本人可见（鉴权）
- `POST /upload/image` 上传取 URL
- `content` 为 `type:text`，存富文本 HTML 无长度限制

**已知前端契约 bug**：现有 `CreatePostBody` 用 `imageUrls`/`topicIds`，与后端 `images`/`topics`（话题名字符串）不符，且缺 `status`。本 change 修正。

## Goals / Non-Goals

**Goals:** 富文本编辑器（官方 `<editor>`）、发布页、话题标签、封面取正文首图、草稿自动保存、草稿箱、编辑已有帖子。

**Non-Goals:** 不改 go-service；不做定时发布、内容审核、协同编辑、@提及、Markdown 源码模式。

## Decisions

**D1. 富文本编辑器用微信官方 `<editor>` 组件**
- Taro `Editor` + `Taro.createSelectorQuery` 获取 `EditorContext`，工具栏按钮调 `ctx.format(name, value)`，提交时 `ctx.getContents()` 取 `{html, text}`。
- 替代方案：纯文本+图文块（结构化，弃因不满足"真正富文本"）；H5 webview 内嵌第三方编辑器（跨端通信复杂，弃）。
- HTML 存 `content`，详情页 `RichText` 已能渲染，读写闭环对齐。

**D2. 草稿 id 生命周期 + 自动保存节流**
- 发布页维护 `draftId`：新建时为空；首次自动保存 `create(status=DRAFT)` 拿 id 并记住；后续 `update(draftId)`。
- 节流：内容变化后 debounce（约 1.5–2s）触发保存，避免每次输入发请求；离开页面前兜底保存一次。
- 从草稿箱进入携带已有 id，直接走 update。

**D3. 封面取正文首图（复用纯函数）**
- 保存/发布前用 `extractImageUrls(html)[0]` 作 `cover`，无图则空。已有纯函数，可单测。

**D4. 话题标签收集**
- 输入区解析 `#话题`，收集为 `topics: string[]`（话题名）。后端 `#` 自动去除、按名 FirstOrCreate。

**D5. 编辑复用同一发布页**
- `pages/publish` 接受 `?id=` 参数：无 id 为新建，有 id 载入帖子回填（草稿或已发布）。已发布帖子 update 不传 status，保持 PUBLISHED。

**D6. 草稿箱承载**
- 独立页 `pages/drafts` 用 `usePagedList(postsApi.findDrafts)` + `PostCard`，点击进 `publish?id=`，删除二次确认。入口挂个人中心。

**D7. 前端契约修正**
- `CreatePostBody`：`{title, content, cover?, status?, images?:string[], topics?:string[]}`；`UpdatePostBody = Partial`。移除 `imageUrls`/`topicIds`。

## Risks / Trade-offs

- [微信 `<editor>` 真机限制，开发者工具支持不完整] → 真机冒烟验证编辑、图片插入、getContents
- [自动保存产生空草稿] → 首次保存前校验标题或正文非空才创建草稿
- [节流保存与手动发布竞态] → 发布前取消 pending 自动保存，串行提交
- [编辑已发布帖子误改状态] → update 不传 status 字段，仅后端 publish 显式转状态
- [草稿 images 全量替换] → 提交时按正文图片顺序整理 images 数组

## Migration Plan

无。新分支开发，复用既有基础，后端零改动。

## Open Questions

- 编辑器工具栏保留哪些按钮（倾向：加粗、标题、列表、图片、话题）——build 阶段定
- 草稿箱入口放个人中心 Tab 还是独立入口——build 阶段定，倾向个人中心入口
