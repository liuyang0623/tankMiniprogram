# post-category-ui Specification

## ADDED Requirements

### Requirement: 发布分类单选

系统 SHALL 在发布页提供分类单选，从 GET /categories 拉取固定分类，用户可选一个分类或不选（归为其他）。

#### Scenario: 选择分类发布

- **WHEN** 用户在发布页选择一个分类并发布
- **THEN** 系统 SHALL 提交该 category 到后端

#### Scenario: 不选分类

- **WHEN** 用户发布时不选分类
- **THEN** 系统 SHALL 提交空分类（前端归入"其他"）

#### Scenario: 编辑回填分类

- **WHEN** 用户编辑已有文章
- **THEN** 系统 SHALL 回填该文章当前分类到单选组件

### Requirement: 个人中心图标化

系统 SHALL 将个人中心的编辑/设置按钮改为 iconfont 单色图标，并排放在个人卡片右上角。

#### Scenario: 图标按钮

- **WHEN** 用户查看个人中心资料卡
- **THEN** 系统 SHALL 在右上角展示编辑和设置图标按钮，点击行为不变（编辑跳资料编辑页，设置开抽屉）
