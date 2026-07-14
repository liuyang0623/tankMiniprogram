# home-content-hub Specification

## Purpose
TBD - created by archiving change home-revamp. Update Purpose after archive.
## Requirements
### Requirement: 首页搜索

系统 SHALL 在首页顶部提供搜索框，用户点击搜索后按文章标题查找并展示结果。

#### Scenario: 搜索文章

- **WHEN** 用户在首页搜索框输入关键词并触发搜索
- **THEN** 系统 SHALL 请求按 title 匹配的文章列表并展示

#### Scenario: 清空搜索

- **WHEN** 用户清空搜索框
- **THEN** 系统 SHALL 恢复当前分类 tab 的列表

### Requirement: 分类 Tab 切换

系统 SHALL 在搜索框下方提供横滑分类 tab（关注、推荐、固定分类、其他），切换时加载对应文章列表。

#### Scenario: 切换分类

- **WHEN** 用户点击某个分类 tab
- **THEN** 系统 SHALL 请求该分类对应的文章列表（category/sort/following）并展示

#### Scenario: 关注 tab

- **WHEN** 已登录用户切到"关注"tab
- **THEN** 系统 SHALL 展示其关注作者的文章

#### Scenario: 未登录隐藏关注

- **WHEN** 用户未登录
- **THEN** 系统 SHALL 隐藏"关注"tab

#### Scenario: 推荐 tab

- **WHEN** 用户切到"推荐"tab
- **THEN** 系统 SHALL 按点赞数倒序展示文章

#### Scenario: 其他 tab

- **WHEN** 用户切到"其他"tab
- **THEN** 系统 SHALL 展示无分类的文章

### Requirement: 发布入口移至首页

系统 SHALL 将发布入口从 TabBar 移至首页搜索框右侧的加号按钮，TabBar 改为三 tab。

#### Scenario: 点击加号发布

- **WHEN** 用户点击首页搜索框右侧加号
- **THEN** 系统 SHALL 跳转发布页

#### Scenario: TabBar 三 tab

- **WHEN** 用户查看底部导航
- **THEN** 系统 SHALL 展示首页/消息/我的三个 tab（无发布）

