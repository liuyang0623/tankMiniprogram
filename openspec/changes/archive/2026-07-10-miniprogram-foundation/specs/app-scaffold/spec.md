## ADDED Requirements

### Requirement: Taro + React + bun 工程脚手架

系统 SHALL 使用 Taro 4 + React 初始化微信小程序工程，并使用 bun 作为包管理与脚本运行工具。工程 MUST 配置微信 appid `wx555c14bc9d837e27`，且能通过微信开发者工具编译预览。

#### Scenario: 全新工程可编译运行

- **WHEN** 开发者在项目根执行 `bun install` 后运行 Taro 微信端编译命令
- **THEN** 系统 SHALL 产出可被微信开发者工具加载的 `dist`（或等价输出），且首页可正常渲染无编译错误

#### Scenario: appid 已正确配置

- **WHEN** 微信开发者工具打开编译产物
- **THEN** 项目配置中的 appid SHALL 为 `wx555c14bc9d837e27`

### Requirement: TabBar 与路由骨架

系统 SHALL 提供底部 TabBar 导航与页面路由骨架，至少包含首页、发布、个人中心三个主入口，未实现的页面以占位内容呈现。

#### Scenario: TabBar 切换主页面

- **WHEN** 用户点击 TabBar 上的某个入口
- **THEN** 系统 SHALL 切换到对应页面且不报错

### Requirement: 环境配置可切换

系统 SHALL 支持通过环境配置切换后端 baseURL，开发默认指向 go-service `http://localhost:3000/api/v1`。

#### Scenario: 切换后端地址

- **WHEN** 开发者修改环境配置中的 baseURL 并重新编译
- **THEN** 后续网络请求 SHALL 使用新的 baseURL，无需改动业务代码
