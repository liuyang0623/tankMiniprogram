## Why

移植 Moo 日记的日记功能（第一期：基础日记编辑），作为独立私密日记模块，与「摆烂随笔」公开社区分开。后端 Change A（diary-backend）已交付 diary 表 + 私密 CRUD + mood/weather 字段，本 change 消费这些接口，实现前端日记编辑/列表/详情体验。

## What Changes

- **新增** `src/pages/diary/` 页面：日记列表（时间线）、日记编辑、日记详情
- **新增** `src/services/api/diary.ts`：日记 API 服务（create/update/remove/list/detail）
- **新增** `src/types/diary.ts`：日记类型定义（Diary, DiaryListItem, DiaryForm, CreateDiaryBody, UpdateDiaryBody, PaginatedDiaries）
- **新增** `src/services/api/index.ts`：导出日记 API
- **新增** `src/assets/tabbar/`：日记 tab 图标（PNG，share 风格）
- **修改** `src/app.config.ts`：tabBar 加第 4 个 tab「日记」（首页/消息/日记/我的）
- **修改** `src/types/api.ts`：新增 PaginatedDiaries 类型
- **复用** `RichEditor`（富文本编辑器）、`uploadApi`（图片上传）、`usePagedList`（分页列表）、`formatRelativeTime`（相对时间）

## Capabilities

### New Capabilities
- `diary-frontend`: 前端日记功能——日记时间线列表、富文本编辑（含心情/天气）、日记详情

### Modified Capabilities
<!-- 无既有 spec 变更 -->

## Impact

- **新增页面**：`pages/diary/index`（列表）、`pages/diary/edit`（编辑，复用 RichEditor）、`pages/diary/detail`（详情）
- **新增组件**：MoodWeatherPicker（心情/天气 emoji 单选）
- **新增服务**：`services/api/diary.ts`（caret 5 个接口）
- **新增类型**：`types/diary.ts`（Diary/DiaryListItem/DiaryForm/CreateDiaryBody/UpdateDiaryBody）
- **修改**：`app.config.ts`（tabBar 四 tab + 新增页面注册）、`services/api/index.ts`（导出 diaryApi）
- **新增图标**：`assets/tabbar/diary.png`（未选灰）、`assets/tabbar/diary-active.png`（选中奶橘）
- **依赖后端**：Change A（diary-backend）的 5 个 REST 接口，依赖 `go-service` 的 `GET /diaries` 等接口
- **不做**：手势密码锁、导出分享、日记统计（第二期）