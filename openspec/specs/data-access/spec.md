# data-access Specification

## Purpose
TBD - created by archiving change miniprogram-foundation. Update Purpose after archive.
## Requirements
### Requirement: HTTP 客户端封装

系统 SHALL 提供基于 `Taro.request` 的统一 HTTP 客户端，自动拼接 baseURL、附加通用请求头，并对 go-service 统一响应结构进行解包，向调用方返回业务数据或规范化错误。

#### Scenario: 成功请求解包数据

- **WHEN** 调用方发起一个成功的接口请求
- **THEN** 客户端 SHALL 返回解包后的业务数据，而非原始响应包裹结构

#### Scenario: 请求失败返回规范化错误

- **WHEN** 接口返回非成功状态或网络异常
- **THEN** 客户端 SHALL 抛出/返回统一结构的错误对象，包含可读错误信息供上层处理

### Requirement: JWT 注入与鉴权失效处理

对受保护接口，系统 SHALL 自动注入 `Authorization: Bearer <jwt>` 请求头；当服务端返回 401 时，SHALL 清除本地登录态并触发重新登录流程。

#### Scenario: 受保护请求注入 token

- **WHEN** 已登录用户调用受保护接口
- **THEN** 请求 SHALL 携带 `Authorization: Bearer <jwt>` 头

#### Scenario: 401 触发重新登录

- **WHEN** 服务端对某请求返回 401
- **THEN** 系统 SHALL 清除本地 token 与用户态，并引导用户重新登录

### Requirement: Zustand 全局状态

系统 SHALL 使用 Zustand 管理全局状态，至少提供用户/鉴权态 store，供全局组件读取与更新。

#### Scenario: 全局读取登录态

- **WHEN** 任一页面或组件读取当前登录态
- **THEN** 系统 SHALL 从 Zustand store 返回一致的登录状态与用户信息

### Requirement: 后端接口契约类型

系统 SHALL 为 go-service `/api/v1` 已实现接口提供 TypeScript 类型（用户、帖子、评论、点赞、收藏、话题、分页等），使数据消费具备类型约束。

#### Scenario: 类型约束接口数据

- **WHEN** 业务代码消费接口返回数据
- **THEN** 该数据 SHALL 具备与后端模型对齐的 TypeScript 类型，字段不匹配时在编译期暴露

