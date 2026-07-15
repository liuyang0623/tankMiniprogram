# Implementation Tasks — diary-frontend（前端日记）

## 1. 基础搭建

- [x] 1.1 新增类型文件 `src/types/diary.ts`（Diary/DiaryListItem/CreateDiaryBody/UpdateDiaryBody）
- [x] 1.2 新增服务 `src/services/api/diary.ts`（5 个接口）+ 导出到 index.ts
- [x] 1.3 注册页面 `src/app.config.ts`（pages 列表加 diary 三页 + tabBar 四 tab 首页/日记/消息/我的）
- [x] 1.4 生成日记 tab 图标（assets/tabbar/diary.png / diary-active.png）
- [x] 1.5 创建 `src/pages/diary/` 目录及组件

## 2. 日记列表页

- [x] 2.1 自定义 header（日记本选择下拉 + 新建日记本按钮）
- [x] 2.2 日记本内容区横向滑动（Swiper）
- [x] 2.3 每个日记本内时间线列表（usePagedList 分页）
- [x] 2.4 列表项卡片（标题/摘要/心情/天气/时间）
- [x] 2.5 点击进入详情，加号进编辑

## 3. 日记编辑页

- [x] 3.1 复用 RichEditor 作为内容编辑器
- [x] 3.2 MoodWeatherPicker 组件（心情 + 天气 emoji 单选）
- [x] 3.3 图片上传（复用 uploadApi）
- [x] 3.4 保存/发布逻辑（create/update）

## 4. 日记详情页

- [x] 4.1 展示正文（RichText）、心情/天气、图片
- [x] 4.2 编辑/删除按钮

## 5. 验证

- [x] 5.1 tsc 类型检查通过
- [x] 5.2 weapp 编译通过
- [x] 5.3 真机冒烟