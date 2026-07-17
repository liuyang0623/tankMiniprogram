# notification-center Specification

## Purpose
TBD - created by archiving change notification-center. Update Purpose after archive.
## Requirements
### Requirement: 关注事件写入系统通知
当一个用户关注另一个用户时，系统 SHALL 为被关注者写入一条 `follow` 类型的系统通知，记录接收者、类型、触发者（关注者）与创建时间，初始为未读。通知写入失败 MUST NOT 影响关注操作本身的成功返回。

#### Scenario: 关注成功后写入通知
- **WHEN** 用户 b 关注用户 a（此前未关注）
- **THEN** 系统为 a 新增一条 `follow` 通知，`actorId` 为 b，`read` 为 false

#### Scenario: 取消关注不写通知
- **WHEN** 用户 b 对已关注的 a 执行取消关注
- **THEN** 系统不新增通知

#### Scenario: 通知写入失败不影响关注
- **WHEN** 关注关系已成功创建，但通知写入发生错误
- **THEN** 关注操作仍返回成功，仅记录错误日志

#### Scenario: 不能关注自己因而不产生通知
- **WHEN** 用户尝试关注自己
- **THEN** 关注被拒绝且不产生任何通知

### Requirement: 系统通知列表
系统 SHALL 提供接口让登录用户按创建时间倒序分页获取自己的系统通知。每条通知 MUST 包含类型、触发者的展示信息（昵称、头像、id）、已读态与创建时间。

#### Scenario: 拉取通知列表
- **WHEN** 登录用户请求通知列表
- **THEN** 返回该用户的通知，按创建时间倒序分页，含触发者昵称/头像/id

#### Scenario: 未登录访问被拒绝
- **WHEN** 未携带有效 JWT 请求通知列表
- **THEN** 返回 401

#### Scenario: 仅返回本人通知
- **WHEN** 用户 a 请求通知列表
- **THEN** 只返回接收者为 a 的通知，不含他人通知

### Requirement: 未读计数与最新摘要
系统 SHALL 提供接口返回登录用户的未读通知总数与最新一条通知的摘要，供消息页聚合入口展示。

#### Scenario: 有未读通知
- **WHEN** 用户存在若干未读通知
- **THEN** 返回未读总数（>0）与最新一条通知的摘要文案

#### Scenario: 无通知
- **WHEN** 用户没有任何通知
- **THEN** 未读总数为 0，摘要为空

### Requirement: 整体标记已读
系统 SHALL 提供接口将登录用户的全部未读通知标记为已读。已读为整体操作，不区分单条。

#### Scenario: 标记全部已读
- **WHEN** 用户调用标记已读接口
- **THEN** 该用户所有未读通知变为已读，后续未读总数为 0

#### Scenario: 无未读时标记已读幂等
- **WHEN** 用户没有未读通知却调用标记已读
- **THEN** 操作成功且未读总数保持 0

### Requirement: 消息页聚合入口
前端消息列表 SHALL 在顶部固定展示一条"系统通知"聚合项，常驻且不随私信会话排序下沉。该项 SHALL 显示最新一条通知摘要与未读红点（未读总数）。

#### Scenario: 存在未读系统通知
- **WHEN** 用户进入消息页且有未读系统通知
- **THEN** 顶部系统通知项显示未读红点与最新摘要

#### Scenario: 无系统通知
- **WHEN** 用户进入消息页且无任何系统通知
- **THEN** 顶部系统通知项仍常驻展示，不显示红点

### Requirement: 系统通知详情页
前端 SHALL 提供独立的系统通知详情页，按时间倒序展示全部系统通知。`follow` 类型通知 SHALL 展示触发者昵称与头像，且**点击昵称或头像跳转到该用户主页**。进入详情页时 SHALL 触发整体标记已读，使入口红点清零。

#### Scenario: 查看系统通知
- **WHEN** 用户从消息页点击系统通知入口
- **THEN** 进入详情页，倒序展示全部系统通知，并触发整体已读、入口红点清零

#### Scenario: 点击关注者跳转主页
- **WHEN** 用户在详情页点击某条 `follow` 通知的昵称或头像
- **THEN** 跳转到该触发者的用户主页

#### Scenario: 通知类型可扩展
- **WHEN** 未来新增 `like`/`comment` 类型通知
- **THEN** 详情页按类型渲染对应文案，无需改动入口聚合结构

