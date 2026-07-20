# inspiration-entry Specification

## Purpose
TBD - created by archiving change inspiration-tab-frontend. Update Purpose after archive.
## Requirements
### Requirement: 灵感 tab 入口
The system SHALL add an "灵感" tab to the bottom tabBar that navigates to the inspiration home page.

#### Scenario: 从 tabBar 进入灵感
- **WHEN** 用户点击底部 tabBar 的「灵感」项
- **THEN** 应用切换到灵感主页，tab 图标切换为选中态

#### Scenario: 主题跟随
- **WHEN** 灵感主页在浅色或深色主题下展示
- **THEN** 页面配色跟随当前主题（复用 PageLayout 与主题 CSS 变量）

### Requirement: 灵感主页板块导航
The system SHALL present four entry cards on the inspiration home page (测运势 / 今天吃什么 / 解惑 / 运动计划), each navigating to its sub-page.

#### Scenario: 进入子板块
- **WHEN** 用户点击任一板块入口卡片
- **THEN** 应用导航到对应子页面

#### Scenario: 入口进场动效
- **WHEN** 灵感主页首次呈现
- **THEN** 四个入口卡片以错位淡入上浮动效依次出现，点击有按压缩放反馈

