# Implementation Tasks — article-publish-richtext

## 1. API 契约修正与类型

- [x] 1.1 修正 `services/api/posts.ts` `CreatePostBody`：`{title, content, cover?, status?, images?:string[], topics?:string[]}`，移除 `imageUrls`/`topicIds`
- [x] 1.2 `UpdatePostBody = Partial<CreatePostBody>`，确认 `create`/`update`/`publish`/`findDrafts`/`remove` 签名
- [x] 1.3 封面纯函数复用：确认 `utils/richtext.ts` `extractImageUrls` 可取首图；补 `firstImage(html)` 或直接用 `[0]`
- [x] 1.4 话题解析纯函数：从输入文本收集 `#话题` → `string[]`（可单测）

## 2. 富文本编辑器封装（article-publish）

- [x] 2.1 编辑器组件：Taro `Editor` + 获取 `EditorContext`，工具栏（加粗/标题/列表/图片/话题）
- [x] 2.2 图片插入：`chooseImage → uploadApi.uploadImage → EditorContext.insertImage`
- [x] 2.3 取内容：`getContents()` 拿 `{html, text}`，暴露给发布页

## 3. 发布页（article-publish）

- [x] 3.1 新增 `pages/publish`（注册路由），标题 Input + 编辑器 + 话题输入
- [x] 3.2 未登录拦截：进入即校验登录，未登录触发 login
- [x] 3.3 发布：校验标题/正文非空 → 封面取首图 → `create(status=PUBLISHED)` 或草稿 `publish` → 进详情/返回
- [x] 3.4 编辑已有帖子：`?id=` 载入回填（标题/正文/话题），保存 `update`（已发布不改 status）

## 4. 草稿自动保存（post-drafts）

- [x] 4.1 `draftId` 生命周期：首次 `create(status=DRAFT)` 拿 id，后续 `update(draftId)`
- [x] 4.2 节流保存：内容变化 debounce（~1.5–2s）；空标题且空正文不创建草稿
- [x] 4.3 发布/离开前兜底：取消 pending 自动保存，串行提交，避免竞态

## 5. 草稿箱页（post-drafts）

- [x] 5.1 新增草稿箱页（`usePagedList(postsApi.findDrafts)` + PostCard + 空态），入口挂个人中心
- [x] 5.2 点击草稿进 `publish?id=` 继续编辑
- [x] 5.3 删除草稿：二次确认 → `remove` → 从列表移除

## 6. 验证

- [x] 6.1 单元测试：封面取首图、话题解析纯函数
- [x] 6.2 tsc 类型校验 + weapp 编译通过
- [x] 6.3 微信开发者工具/真机冒烟：富文本编辑、图片插入、话题、发布、自动保存草稿、草稿箱继续编辑/删除、编辑已发布帖子、未登录拦截
