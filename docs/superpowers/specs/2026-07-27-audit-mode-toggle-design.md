---
comet_change: audit-mode-toggle
role: technical-design
canonical_spec: openspec
---

# Design Doc: 审核模式开关

## 1. 概述

通过服务端全局配置控制客户端是否进入"审核模式"。开启后隐藏首页/消息 tab、灵感解惑板块，重定向到日记页面，跳过未读消息拉取。

## 2. 架构

```
启动流程 (app.tsx)
    │
    ├── useAuthStore.restore()          // 恢复登录态（已有）
    ├── useAuditStore.load()            // ◀ 新增：拉取 /app-config
    │       └── optionalAuthRequest('/app-config')
    ├── !auditMode && isLogin
    │       ├── loadConversations()     // 已登录时拉未读
    │       └── refreshUnread()
    ├── auditMode ? switchTab(diary)    // ◀ 新增：审核模式跳转
    └── useThemeStore.init()            // 主题初始化（已有）
```

### 2.1 状态层

**`src/store/audit.ts`**

```typescript
interface AuditState {
  auditMode: boolean   // false = 正常模式（默认）
  loaded: boolean      // true = 已完成一次配置拉取
  load: () => Promise<void>  // 拉取配置，失败降级
}
```

- 使用 zustand `create`，与项目现有 store 模式一致
- `loaded` 标志避免重复拉取
- `load()` 的 catch 块中设置 `{ auditMode: false, loaded: true }`

### 2.2 API 层

**`src/services/api/appConfig.ts`**

```typescript
export interface AppConfig { auditMode: boolean }
export const appConfigApi = {
  get: () => optionalAuthRequest<AppConfig>({ url: '/app-config' })
}
```

- 使用 `optionalAuthRequest`（可选鉴权），无需用户登录即可调用
- 路由 `/app-config` 对应后端 OptionalJWT 路由

### 2.3 UI 层

#### 自定义 Tab Bar

**`src/custom-tab-bar/index.tsx`**

TabItem 定义新增 `auditHidden?: boolean` 字段：

```typescript
const TABS: TabItem[] = [
  { key: 'home', ..., auditHidden: true },        // 审核隐藏
  { key: 'diary', ... },                           // 始终显示
  { key: 'inspiration', ... },                     // 始终显示
  { key: 'message', ..., auditHidden: true },     // 审核隐藏
  { key: 'profile', ... },                         // 始终显示
]
```

渲染时过滤：`tabs = auditMode ? TABS.filter(t => !t.auditHidden) : TABS`

#### 灵感页适配

**`src/pages/inspiration/index.tsx`**

```typescript
const sections = auditMode ? SECTIONS.filter(s => s.key !== 'qa') : SECTIONS
```

审核模式下隐藏「解惑」板块（UGC 互助内容），保留测运势、今天吃什么、运动计划。

## 3. 关键决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 配置获取时机 | 启动时同步调用（await） | 影响后续消息拉取和 tab 渲染时机，需同步 |
| 失败策略 | 降级为正常模式 | 避免接口异常导致应用不可用 |
| Tab 过滤方式 | 运行时按 `auditHidden` 过滤 | 不需要重新编译或配置更新 |
| 路由调整 | 不修改 pages 顺序，而是将 diary 移到首位 | switchTab 要求目标页在 pages 列表中，diary 需可被路由 |

## 4. 变更文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/store/audit.ts` | 新增 | 审核模式 zustand store |
| `src/store/__tests__/audit.test.ts` | 新增 | 单元测试 |
| `src/services/api/appConfig.ts` | 新增 | 全局配置 API |
| `src/services/api/index.ts` | 修改 | 导出 appConfig + AppConfig 类型 |
| `src/app.tsx` | 修改 | 集成 auditMode 到启动流程 |
| `src/custom-tab-bar/index.tsx` | 新增 | 审核模式下过滤 tab bar |
| `src/custom-tab-bar/index.scss` | 新增 | 自定义 tab bar 样式 |
| `src/app.config.ts` | 修改 | **diary 页面提到 pages 列表首位** |
| `src/pages/inspiration/index.tsx` | 修改 | 审核模式下隐藏解惑板块 |
| `src/store/theme.ts` | 修改 | 无变动（已确认无 audit 依赖） |
| `src/utils/tabbar.ts` | 修改 | 简化导出（仅保留 applyNavBarColor） |
| `src/pages/messages/index.tsx` | 保持现状 | 审核模式下入口隐藏，不额外处理 |

## 5. 测试策略

- **audit store**: vitest 单元测试覆盖三条路径（默认值、成功加载、失败降级）
- **UI 层**: 不单独做单元集成测试，通过手动验证 tab bar 过滤、灵感页板块显示/隐藏
- **冒烟测试**: 正常模式启动 → 所有 tab 可见；审核模式模拟 → 仅见日记/灵感/我的，自动跳转日记

## 6. 已知风险

| 风险 | 等级 | 缓解 |
|------|------|------|
| `/app-config` 接口超时 | 低 | try/catch 降级，不影响主流程 |
| diary 页面不在 pages 首位 | **高** | Design Doc 明确要求将 diary 提到 pages 列表首位 |
| 审核模式下用户直接访问消息页 | 低 | 用户通过 switchTab 跳转至 diary，间接访问概率极低 |
