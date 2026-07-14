# relative-time-display Specification

## ADDED Requirements

### Requirement: 相对时间格式化

系统 SHALL 提供 `formatRelativeTime` 工具，将 ISO 时间字符串按主流相对格式展示：刚刚(<1分)、x分钟前(<60分)、x小时前(<24时)、x天前(<30天)、年月日(≥30天，今年省略年份)。

#### Scenario: 刚刚

- **WHEN** 时间距现在小于 1 分钟
- **THEN** 系统 SHALL 显示"刚刚"

#### Scenario: 分钟/小时/天前

- **WHEN** 时间距现在在分钟/小时/天区间
- **THEN** 系统 SHALL 显示"x分钟前"/"x小时前"/"x天前"

#### Scenario: 超过30天显示日期

- **WHEN** 时间距现在超过 30 天
- **THEN** 系统 SHALL 显示年月日（今年省略年份）

### Requirement: 文章与评论时间展示

系统 SHALL 在文章详情、评论项展示相对时间（文章卡片不展示）。

#### Scenario: 文章详情时间

- **WHEN** 展示文章详情
- **THEN** 系统 SHALL 在作者昵称下方显示文章发布时间的相对格式

#### Scenario: 评论时间

- **WHEN** 展示评论项
- **THEN** 系统 SHALL 在操作行左侧显示评论时间的相对格式，点赞/回复/删除按钮在右侧
