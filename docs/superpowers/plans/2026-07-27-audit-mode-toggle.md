---
archived-with: 2026-07-27-audit-mode-toggle
status: final
---
# 审核模式开关 - 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补齐审核模式开关功能的剩余工作——将 diary 页面移至 pages 列表首位，确认消息页无需额外改动。

**Architecture:** 大部分代码已在上次 commit 中实现（audit store、appConfig API、启动流程集成、tab bar 过滤、灵感页适配）。剩余工作仅涉及 `app.config.ts` 中 pages 顺序调整。

**Tech Stack:** Taro 小程序框架，TypeScript

## Global Constraints

- diary 页面必须位于 `pages` 数组首位（`src/app.config.ts:4-25`），因为 `switchTab` 要求目标页在 pages 列表中可被路由
- 所有现有任务 1-7、10-12 已在代码中标记为完成（[x]），本次计划仅覆盖剩余任务

---

### Task 1: 修改 app.config.ts — diary 页面提到 pages 列表首位

**Files:**
- Modify: `src/app.config.ts`

**Interfaces:**
- Consumes: 无
- Produces: `pages` 数组首项变为 `'pages/diary/index'`

**Step 1: 移动 diary 页面到 pages 首位**

将 `pages/diary/index` 从当前第 15 行移动到 pages 数组第一个位置：

```typescript
// app.config.ts pages 数组改为：
pages: [
  'pages/diary/index',          // ◀ 移到首位，使 switchTab 可路由
  'pages/index/index',
  'pages/messages/index',
  'pages/publish/index',
  'pages/profile/index',
  'pages/detail/index',
  'pages/profile-edit/index',
  'pages/drafts/index',
  'pages/user-profile/index',
  'pages/follow-list/index',
  'pages/chat/index',
  'pages/diary/edit',
  'pages/diary/detail',
  'pages/inspiration/index',
  'pages/inspiration/fortune',
  'pages/inspiration/food',
  'pages/inspiration/qa',
  'pages/inspiration/qa-detail',
  'pages/inspiration/sport',
  'pages/notifications/index',
],
```

- [x] **Step 1.1: 编辑 app.config.ts**

使用 Edit 工具，将 `src/app.config.ts` 的 pages 数组调整为上述顺序。具体操作：删除第 15 行的 `'pages/diary/index',`，在第 4 行之后（pages 数组开头）插入。

- [x] **Step 1.2: 验证变更**

运行 `git diff src/app.config.ts` 确认只移动了 diary 页面，未改动其他内容。

- [x] **Step 1.3: 提交**

```bash
git add src/app.config.ts
git commit -m "feat(audit-mode): 将diary页面移到pages首位以支持审核模式跳转"
```

### Task 2: 确认消息页无需改动

**Files:**
- Read-only: `src/pages/messages/index.tsx`

**Interfaces:**
- Consumes: 无
- Produces: 确认文件中无 auditMode 依赖

**Step 2.1: 验证消息页不需要修改**

审查 `src/pages/messages/index.tsx` 确认：
- 文件中无任何对 `useAuditStore`、`auditMode` 的引用
- 文件中无任何对 audit store 的 import
- 审核模式下消息 tab 通过 tab bar 过滤隐藏，用户无法主动到达该页
- 消息页自身的 `useDidShow` 中的未读消息拉取逻辑在正常模式下才执行，审核模式下不会触发

- [x] **Step 2.2: 标记任务 9 完成**

将 `openspec/changes/audit-mode-toggle/tasks.md` 中的任务 9 标记为 [x]：

```markdown
- [x] 9. 修改 `src/pages/messages/index.tsx` — 消息页适配（保持现状）
```

### Task 3: 标记所有任务完成

**Files:**
- Modify: `openspec/changes/audit-mode-toggle/tasks.md`

**Step 3.1: 更新 tasks.md**

确认所有任务均已标记完成：

```markdown
# Tasks: 审核模式开关

- [x] 1. 创建 `src/store/audit.ts` — 审核模式 zustand store
- [x] 2. 创建 `src/services/api/appConfig.ts` — 全局配置 API
- [x] 3. 修改 `src/services/api/index.ts` — 导出 appConfig
- [x] 4. 修改 `src/app.tsx` — 启动流程集成 auditMode
- [x] 5. 创建 `src/custom-tab-bar/index.tsx` — 审核模式下过滤 tab bar
- [x] 6. 创建 `src/custom-tab-bar/index.scss` — 自定义 tab bar 样式
- [x] 7. 修改 `src/pages/inspiration/index.tsx` — 灵感页适配
- [x] 8. 修改 `src/app.config.ts` — diary 页面提到 pages 列表首位
- [x] 9. 修改 `src/pages/messages/index.tsx` — 消息页适配（保持现状）
- [x] 10. 修改 `src/store/theme.ts` — 清理对 audit 状态的依赖（无需变动）
- [x] 11. 修改 `src/utils/tabbar.ts` — 简化 tabbar 工具函数
- [x] 12. 创建 `src/store/__tests__/audit.test.ts` — audit store 单元测试
```

- [x] **Step 3.2: 最终 git status 检查**

```bash
git status
```

确认所有预期文件都已 track，无未追踪或遗漏的修改。

---

## Self-Review 检查清单

**1. Spec coverage:**
- Design Doc §4 变更文件清单中 `app.config.ts` 修改 → Task 1 覆盖
- Design Doc §4 中 `src/pages/messages/index.tsx` 保持现状 → Task 2 覆盖
- Design Doc §3 关键决策「路由调整」diary 移到首位 → Task 1 精确对应

**2. Placeholder scan:** 无占位符，每个步骤包含完整文件路径和具体内容

**3. Type consistency:** 不涉及类型变更，仅数组顺序调整

---

Plan complete and saved to `docs/superpowers/plans/2026-07-27-audit-mode-toggle.md`. 剩余工作仅 2 个变更点，建议直接内联执行。
