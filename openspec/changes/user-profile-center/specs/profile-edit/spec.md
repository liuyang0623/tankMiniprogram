## ADDED Requirements

### Requirement: 资料编辑

系统 SHALL 提供独立的资料编辑页，允许用户修改昵称、简介、性别、头像，提交 `PATCH /users/profile` 做部分更新，保存后返回并刷新个人中心展示。

#### Scenario: 编辑并保存资料

- **WHEN** 用户在编辑页修改昵称/简介/性别并保存
- **THEN** 系统 SHALL 提交变更字段，成功后更新本地用户态并返回个人中心

#### Scenario: 保存失败提示

- **WHEN** 资料保存接口失败
- **THEN** 系统 SHALL 提示保存失败，不改变原有资料

### Requirement: 头像上传

系统 SHALL 支持在资料编辑页选择图片作为头像，先经 `POST /upload/image` 上传取得 URL，再随资料一并保存。

#### Scenario: 更换头像

- **WHEN** 用户选择一张图片作为新头像
- **THEN** 系统 SHALL 上传该图片取得 URL，并在保存资料时使用该 URL

#### Scenario: 上传失败

- **WHEN** 头像图片上传失败
- **THEN** 系统 SHALL 提示上传失败，保留原头像
