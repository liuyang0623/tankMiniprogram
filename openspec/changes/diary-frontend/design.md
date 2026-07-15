# diary-frontend Design

> 详细技术设计见 `docs/superpowers/specs/2026-07-14-diary-frontend-design.md`（comet Design Doc）。本文件为 openspec 摘要。

## 选题
Moo 日记风格前端。第一期：日记本 + 大图手帐卡横滑 + 富文本编辑 + 心情天气。

## 范围拆分（跨两仓库，先 A2 后 B）
- **Change A2（go-service）diary-notebook**：notebook 表 + diary 加 notebook_id + CRUD + 默认本 + 过滤
- **Change B（本 change）diary-frontend**：前端页面/组件/服务，依赖 A2

## 页面

| 页面 | 路由 | 功能 |
|------|------|------|
| 列表 | pages/diary/index | 自定义 header 抽屉（切/建/管理日记本）+ Swiper 大图卡横滑翻日记 |
| 编辑 | pages/diary/edit | notebook 选择 + 标题 + MoodWeatherPicker + RichEditor + 图片 |
| 详情 | pages/diary/detail | 封面大图 + 正文 RichText + 心情天气 + 编辑/删除 |

## 组件
- **NotebookDrawer**：向下抽屉，日记本列表 + 新建 + 管理
- **DiaryCard**：大图手帐卡，封面铺满 + 底部渐变叠标题/心情/天气/日期；无封面用 notebook.color 兜底
- **MoodWeatherPicker**：心情 5 + 天气 5 emoji 单选

## 数据流
follow-list 成熟模式：notebooks/activeNb/diaries 三态，切日记本 useEffect 重拉，useDidShow 返回刷新。避免 usePagedList 闭包坑。

## 类型 / API
- types/diary.ts：Notebook/Diary/DiaryListItem/Create*Body + MOODS/WEATHERS 常量
- services/api/diary.ts：diaryApi（5）+ notebookApi（4），消费 A2 契约

## 复用
RichEditor / uploadApi / usePagedList / formatRelativeTime / Iconfont / PageLayout / 主题 token（奶橘 #f0a868）

## tabBar
四 tab（首页/日记/消息/我的），日记图标沿用 gen-tabbar-icons（iconfont → ImageMagick 81×81 PNG 灰/奶橘）。

## 测试
tsc + weapp 编译；纯逻辑单测（mood/weather 映射、notebook query、无封面兜底）；真机冒烟（抽屉 CRUD、横滑、写日记、详情、四 tab）。

## 边界
一屏卡片只显示封面+标题（全文在详情）；依赖 A2 先上线；分页/统计/密码锁/导出留第二期。
