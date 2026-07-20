# qa-frontend

## ADDED Requirements

### Requirement: 浏览全站问题列表
The system SHALL display a paginated list of all questions fetched from the backend, ordered newest first.

#### Scenario: 加载问题列表
- **WHEN** 用户进入解惑页
- **THEN** 系统请求全站问题列表并展示每项的标题、回答数、相对时间，卡片以错位淡入呈现

#### Scenario: 未登录引导
- **WHEN** 未登录用户进入解惑页
- **THEN** 系统展示登录引导（复用现有微信一键登录模式），不请求受保护接口

#### Scenario: 空列表
- **WHEN** 全站暂无问题
- **THEN** 系统展示温柔的空状态文案，引导用户提出第一个问题

### Requirement: 查看问题详情与回答
The system SHALL show a question's full content and all its answers.

#### Scenario: 打开详情
- **WHEN** 用户点击某个问题卡片
- **THEN** 系统导航到详情页并展示问题正文与回答列表（正序）

### Requirement: 提问
The system SHALL allow a logged-in user to submit a new question.

#### Scenario: 成功提问
- **WHEN** 用户填写标题并提交提问
- **THEN** 系统调用后端创建问题，成功后回到列表并可见新问题

#### Scenario: 标题为空拦截
- **WHEN** 用户未填写标题即提交
- **THEN** 系统前端拦截并提示标题必填，不发起请求

### Requirement: 回答问题
The system SHALL allow a logged-in user to answer any question.

#### Scenario: 成功回答
- **WHEN** 用户在详情页输入回答内容并提交
- **THEN** 系统调用后端创建回答，成功后回答出现在回答列表中

#### Scenario: 回答内容为空拦截
- **WHEN** 用户提交空回答
- **THEN** 系统前端拦截并提示内容必填
