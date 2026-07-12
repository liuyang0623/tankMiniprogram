# article-publish Specification

## Purpose
TBD - created by archiving change article-publish-richtext. Update Purpose after archive.
## Requirements
### Requirement: 富文本编辑器

系统 SHALL 提供基于微信官方 `<editor>` 组件的富文本编辑器，支持标题、加粗、列表等基础排版，正文以 HTML 形式保存到帖子 `content` 字段，详情页可原样渲染。

#### Scenario: 撰写富文本正文

- **WHEN** 用户在发布页输入标题并使用编辑器工具栏进行排版
- **THEN** 系统 SHALL 记录富文本 HTML，保存后详情页以 `RichText` 正确渲染

#### Scenario: 编辑器内插入图片

- **WHEN** 用户在编辑器中选择插入图片
- **THEN** 系统 SHALL 先经 `POST /upload/image` 上传取得 URL，再通过 `EditorContext.insertImage` 插入到光标位置

#### Scenario: 分层工具栏应用富文本格式

- **WHEN** 用户使用常驻工具栏（加粗/标题/列表）或展开「更多」面板选择格式（斜体/下划线/颜色/背景/字号/对齐/引用/分割线）
- **THEN** 系统 SHALL 通过 `EditorContext.format` 应用对应格式；选值型格式（颜色/背景/字号/对齐）SHALL 使用预设选项（预设色板、S/M/L 字号），不提供连续取色或任意数值

### Requirement: 发布帖子

系统 SHALL 允许已登录用户发布帖子，提交 `POST /posts`（`status=PUBLISHED`）或对草稿调用 `POST /posts/:id/publish`，发布成功后进入详情或返回列表。

#### Scenario: 直接发布新帖子

- **WHEN** 用户填写标题与正文后点击发布
- **THEN** 系统 SHALL 提交帖子（status=PUBLISHED），成功后展示该帖子

#### Scenario: 草稿转发布

- **WHEN** 用户对一篇已保存的草稿点击发布
- **THEN** 系统 SHALL 调用发布接口将其转为 PUBLISHED 并设置发布时间

#### Scenario: 标题或正文为空

- **WHEN** 用户在标题或正文为空时点击发布
- **THEN** 系统 SHALL 阻止发布并提示补全内容

### Requirement: 话题标签

系统 SHALL 支持用户为帖子添加话题标签，收集为话题名字符串数组随帖子提交（`topics`），后端按名去重创建关联。

#### Scenario: 添加话题标签

- **WHEN** 用户输入 `#话题` 形式的标签
- **THEN** 系统 SHALL 将话题名收集进 `topics` 数组并在提交时一并发送

### Requirement: 封面自动取正文首图

系统 SHALL 在保存或发布时，自动提取正文 HTML 中的第一张图片 URL 作为帖子封面 `cover`；若正文无图片则封面为空。

#### Scenario: 正文含图片

- **WHEN** 用户提交的正文包含至少一张图片
- **THEN** 系统 SHALL 取第一张图片 URL 作为 `cover`

#### Scenario: 正文无图片

- **WHEN** 用户提交的正文不含任何图片
- **THEN** 系统 SHALL 将 `cover` 置空，不阻断提交

### Requirement: 编辑已有帖子

系统 SHALL 允许作者编辑自己已发布的帖子或草稿，复用 `PATCH /posts/:id` 部分更新，已发布帖子编辑后保持 PUBLISHED 状态。

#### Scenario: 编辑已发布帖子

- **WHEN** 作者进入自己已发布帖子的编辑并保存
- **THEN** 系统 SHALL 提交变更字段并保持该帖子为 PUBLISHED

### Requirement: 未登录发布拦截

系统 SHALL 在未登录用户进入发布页时进行登录拦截，登录成功后方可撰写与提交。

#### Scenario: 未登录进入发布页

- **WHEN** 未登录用户尝试进入发布页
- **THEN** 系统 SHALL 触发登录，未登录不得提交帖子

