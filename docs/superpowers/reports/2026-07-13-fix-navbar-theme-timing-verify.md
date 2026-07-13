# 验证报告 — fix-navbar-theme-timing（hotfix）

- Change: fix-navbar-theme-timing
- 验证级别: light（任务 3 / 无 delta spec / 改动 6 文件，均在轻量阈值）
- 日期: 2026-07-13
- 分支: hotfix/20260713/fix-navbar-theme-timing

## 轻量验证 6 项

| 项 | 结果 |
|----|------|
| tasks.md 全部勾选 | ✅ 3/3 |
| 改动与 tasks 一致 | ✅ 仅 PageLayout 导航栏时机（对齐 tasks 1.1） |
| 编译通过 | ✅ `bun run build:weapp` Compiled successfully |
| 相关测试通过 | ✅ `bun run test` 45/45 |
| 无安全问题 | ✅ 无硬编码密钥/unsafe |
| 代码审查 | review_mode: off（hotfix 默认，单文件时序修复，跳过自动审查） |

## 验证证据（新鲜运行）

- `bunx tsc --noEmit` → exit 0
- `bun run test` → 45/45 passed
- `bun run build:weapp` → Compiled successfully

## 修复摘要

- **bug**：切暗色后 navigateTo 进首页/发布页，导航栏 header 仍浅色
- **根因**：PageLayout 仅用 useEffect 挂载时调 setNavigationBarColor，此时导航栏原生组件未就绪，调用被微信忽略
- **修复**：PageLayout 加 `useDidShow(() => applyNavBarColor(resolved))`，页面显示时导航栏已渲染，应用可靠；保留 useEffect 覆盖停留当前页切换的即时性
- **根因消除检查**：已确认 useDidShow 覆盖 navigateTo 场景，无深层架构问题/接口变更/升级信号

## 结论

**通过（编译级）。** tsc / test 45 / build 全绿。

## 已知项（待真机确认）

- 真机冒烟：切暗色 → navigateTo 首页/发布页/详情，导航栏均为暗色；切回亮色同理；跟随系统切换后进页面导航栏正确
- useDidShow 在 PageLayout 子组件绑定宿主页面 onShow（Taro 支持，profile 页已用），真机确认各页面触发正常
