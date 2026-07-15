# diary-frontend Specification

## ADDED Requirements

### Requirement: 日记本切换与管理

系统 SHALL 在日记列表页提供自定义 header，点击后向下弹出抽屉，用户可切换、新建、改名、删除日记本。

#### Scenario: 切换日记本

- **WHEN** 用户在抽屉中选择某日记本
- **THEN** 系统 SHALL 收起抽屉并在主内容区加载该日记本的日记

#### Scenario: 新建日记本

- **WHEN** 用户在抽屉中新建日记本（名称 + 颜色）
- **THEN** 系统 SHALL 创建日记本并自动切换到新本

#### Scenario: 改名/删除日记本

- **WHEN** 用户在管理中改名或删除日记本
- **THEN** 系统 SHALL 更新或删除该日记本并刷新列表

### Requirement: 日记横滑浏览

系统 SHALL 在主内容区以大图手帐卡横滑展示当前日记本里的日记，一屏一篇。

#### Scenario: 横滑翻日记

- **WHEN** 用户在主内容区左右滑动
- **THEN** 系统 SHALL 切换显示当前日记本里的上一篇/下一篇日记

#### Scenario: 无封面兜底

- **WHEN** 某篇日记没有封面图
- **THEN** 系统 SHALL 用所属日记本的颜色作为卡片背景并居中显示标题

#### Scenario: 空日记本

- **WHEN** 当前日记本没有任何日记
- **THEN** 系统 SHALL 显示空态提示引导用户写第一篇

#### Scenario: 点击进入详情

- **WHEN** 用户点击当前显示的日记卡片
- **THEN** 系统 SHALL 跳转到该日记详情页

### Requirement: 日记编辑

系统 SHALL 提供日记编辑页，含归属日记本选择、标题、心情/天气单选、富文本正文、图片上传。

#### Scenario: 新建日记

- **WHEN** 用户填写内容并保存
- **THEN** 系统 SHALL 创建日记（归属所选日记本）并返回列表

#### Scenario: 编辑日记

- **WHEN** 用户从详情进入编辑并保存
- **THEN** 系统 SHALL 更新该日记并同步列表/详情

#### Scenario: 心情天气单选

- **WHEN** 用户点选某个心情或天气
- **THEN** 系统 SHALL 高亮该选项并在保存时提交对应 key

### Requirement: 日记详情

系统 SHALL 提供日记详情页，展示封面、标题、心情/天气、日期、富文本正文，并支持编辑和删除。

#### Scenario: 查看详情

- **WHEN** 用户进入日记详情
- **THEN** 系统 SHALL 渲染完整正文（富文本）、心情/天气、日期

#### Scenario: 删除日记

- **WHEN** 用户在详情页删除日记并确认
- **THEN** 系统 SHALL 删除该日记并返回列表

### Requirement: 日记 tab 入口

系统 SHALL 在 tabBar 提供「日记」入口，顺序为 首页 / 日记 / 消息 / 我的。

#### Scenario: 从 tab 进入日记

- **WHEN** 用户点击「日记」tab
- **THEN** 系统 SHALL 显示日记列表页，图标选中态为奶橘色
