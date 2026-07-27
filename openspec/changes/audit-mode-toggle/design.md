# Design: 审核模式开关

## Context

小程序启动时已有多个 zustand store 初始化流程（auth、theme），以及已登录时的未读消息拉取。需要新增一个全局配置拉取链路，并在 App 入口根据结果做条件分支。

## 架构决策

### 1. 状态管理：zustand store

复用已有的 zustand 模式，新建 `src/store/audit.ts`：

```typescript
interface AuditState {
  auditMode: boolean
  loaded: boolean
  load: () => Promise<void>
}
```

- `loaded` 标志用于避免重复拉取
- 失败降级为 `auditMode: false`，保证可用性

### 2. API 配置端点

在 `src/services/api/appConfig.ts` 新增 API 调用，服务端返回 `{ auditMode: boolean }`。

### 3. App 入口集成

在 `useLaunch` 回调中按顺序执行：
1. 恢复登录态（已有逻辑）
2. **新增**：拉取全局配置 `useAuditStore.load()`
3. **修改**：未读消息拉取增加 `!auditMode` 前置条件
4. **新增**：审核模式下 `Taro.switchTab('/pages/diary/index')`
5. 主题初始化（已有逻辑）

### 4. Tab Bar 过滤

自定义 tab bar 组件（`src/custom-tab-bar/index.tsx`）读取 `auditMode`，动态过滤要显示的 tab：
- 审核模式下仅显示「日记」和「我的」（或配置指定的 tab）
- 隐藏「首页」和「消息」tab

### 5. 页面配置调整

`src/app.config.ts` 中 diary page 需已在 pages 列表中，无需新增页面路由。

## 文件清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `src/store/audit.ts` | 新增 | 审核模式 zustand store |
| `src/store/__tests__/audit.test.ts` | 新增 | audit store 单元测试 |
| `src/services/api/appConfig.ts` | 新增 | 全局配置 API 调用 |
| `src/services/api/index.ts` | 修改 | 导出 appConfig |
| `src/app.tsx` | 修改 | 启动流程集成 auditMode |
| `src/custom-tab-bar/index.tsx` | 新增 | 审核模式下过滤 tab bar |
| `src/custom-tab-bar/index.scss` | 新增 | 自定义 tab bar 样式 |
| `src/app.config.ts` | 修改 | 确保 diary 页面在 pages 列表首位 |
| `src/pages/inspiration/index.tsx` | 修改 | 灵感页适配审核模式 |
| `src/pages/messages/index.tsx` | 修改 | 消息页适配审核模式 |
| `src/store/theme.ts` | 修改 | 清理对 audit 状态的依赖 |
| `src/utils/tabbar.ts` | 修改 | 简化 tabbar 工具函数 |

## 风险与缓解

| 风险 | 缓解 |
|------|------|
| API 拉取超时导致启动变慢 | 异步并行 + catch 降级 |
| 客户端缓存导致状态不更新 | 每次启动都拉取最新值，无缓存 |
| diary tab 不存在导致崩溃 | config.ts 中校验 pages 列表 |
