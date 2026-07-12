## Why

「摆烂随笔」已实现浏览、详情、互动、登录、个人中心，唯独缺少内容生产的入口——用户只能看别人的帖子，无法自己发帖。富文本发布是社区产品内容闭环的最后一块，也是四拆分 change 规划中的收尾项。后端 go-service 的帖子 create/update/publish/drafts 接口已全部就绪，本次为纯前端交付。

## What Changes

- **富文本编辑器**：接入微信官方 `<editor>` 组件（Taro `Editor` + `EditorContext`），支持加粗/标题/列表等排版与图片插入，产出 HTML 存后端 `content`（详情页现有 `RichText` 直接渲染，读写闭环对齐）
- **发布页**：新增 `pages/publish`，撰写标题 + 富文本正文 + 话题标签，支持发布与存草稿
- **图片插入**：编辑器内 `chooseImage → uploadApi.uploadImage → EditorContext.insertImage`
- **话题标签**：输入 `#话题` 收集为 `topics: string[]`（话题名字符串，非 id）
- **封面自动取正文首图**：保存/发布时用 `extractImageUrls` 抠取 HTML 第一张图作 `cover`
- **草稿自动保存**：编辑过程中节流调用 `create`（首次拿草稿 id）/ `update`，避免内容丢失
- **草稿箱页**：新增草稿列表（`findDrafts`），支持继续编辑与删除
- **编辑已有帖子**：复用 `update`，支持编辑已发布帖子（保持 PUBLISHED）与草稿
- **修正前端契约**：`CreatePostBody`/`UpdatePostBody` 字段对齐后端（`images`/`topics`/`status`，替换错误的 `imageUrls`/`topicIds`）

## Capabilities

### New Capabilities

- `article-publish`: 富文本发布——编辑器（标题/正文/图片/话题）、发布、编辑已有帖子、封面取正文首图、未登录拦截
- `post-drafts`: 草稿能力——自动保存草稿、草稿箱列表、继续编辑、删除草稿

### Modified Capabilities

<!-- 无。后端契约已足，前端 CreatePostBody 字段修正属实现细节，不改既有能力的 spec 级需求。 -->

## Impact

- **新增页面**：`src/pages/publish`（发布/编辑）、草稿箱（独立页或个人中心 Tab）
- **新增组件**：富文本编辑器封装（`Editor` + 工具栏 + 图片上传）
- **修改**：`src/services/api/posts.ts`（`CreatePostBody`/`UpdatePostBody` 对齐后端字段）、`src/app.config.ts`（注册路由）
- **复用**：`uploadApi.uploadImage`、`utils/richtext.ts` `extractImageUrls`、`authStore`、`usePagedList`、`PostCard`、设计 token
- **后端契约（无需改动）**：`POST /posts`（含 status）、`PATCH /posts/:id`、`POST /posts/:id/publish`、`GET /posts/drafts`、`POST /upload/image`
- **已知契约风险**：微信 `<editor>` 组件真机限制（开发者工具支持不完整），需真机冒烟验证编辑与图片插入
