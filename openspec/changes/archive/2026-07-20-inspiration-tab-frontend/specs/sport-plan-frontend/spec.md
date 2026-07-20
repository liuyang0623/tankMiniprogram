# sport-plan-frontend

## ADDED Requirements

### Requirement: 查看运动目标列表
The system SHALL display the current user's sport goals with progress fetched from the backend.

#### Scenario: 加载目标列表
- **WHEN** 用户进入运动计划页
- **THEN** 系统请求本人目标列表并展示每个目标的名称、连续天数、总打卡天数、今日是否已打卡

#### Scenario: 未登录引导
- **WHEN** 未登录用户进入运动计划页
- **THEN** 系统展示登录引导，不请求受保护接口

#### Scenario: 环形进度动效
- **WHEN** 目标卡片呈现
- **THEN** 打卡进度以环形/进度条动画呈现，进入时有渐进填充效果

### Requirement: 创建运动目标
The system SHALL allow a logged-in user to create a sport goal.

#### Scenario: 成功创建
- **WHEN** 用户填写目标名称（及可选类型/目标天数）并提交
- **THEN** 系统调用后端创建目标，成功后目标出现在列表中

#### Scenario: 名称为空拦截
- **WHEN** 用户未填写名称即提交
- **THEN** 系统前端拦截并提示名称必填

### Requirement: 打卡
The system SHALL allow the user to check in a goal for the current day.

#### Scenario: 成功打卡
- **WHEN** 用户对今日未打卡的目标点击打卡
- **THEN** 系统调用后端打卡接口，成功后连续天数与总天数更新，并播放庆祝反馈动效

#### Scenario: 今日已打卡态
- **WHEN** 目标今日已打卡
- **THEN** 打卡按钮呈现已完成态（禁用或高亮），再次点击不重复计数
