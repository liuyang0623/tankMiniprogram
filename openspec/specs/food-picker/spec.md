# food-picker Specification

## Purpose
TBD - created by archiving change inspiration-tab-frontend. Update Purpose after archive.
## Requirements
### Requirement: 今天吃什么随机推荐
The system SHALL recommend a dish randomly from a client-side dish list, without any backend call.

#### Scenario: 随机选菜
- **WHEN** 用户点击「帮我决定 / 换一个」
- **THEN** 系统从本地菜品数据中随机选出一道并展示（含名称、可选 emoji/图标、简短描述）

#### Scenario: 老虎机滚动动效
- **WHEN** 随机抽取进行中
- **THEN** 候选菜品以老虎机式滚动切换呈现，落定时目标项有缩放回弹与高亮

#### Scenario: 分类筛选（可选）
- **WHEN** 用户选择某个餐别或口味分类后再抽取
- **THEN** 系统仅在该分类范围内随机推荐

