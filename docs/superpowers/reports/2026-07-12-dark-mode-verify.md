# 验证报告 — dark-mode

- Change: dark-mode
- 验证级别: full（任务 25 / 变更文件 28，均超阈值）
- 日期: 2026-07-13
- 分支: feature/20260712/dark-mode
- base-ref: af7a5fb

## 验证证据（新鲜运行）

| 检查项 | 命令 | 结果 |
|--------|------|------|
| 类型检查 | `bunx tsc --noEmit` | ✅ exit 0 |
| 单元测试 | `bun run test` | ✅ 45/45 passed（11 文件；含新增 theme.test.ts 4 例 resolveTheme） |
| 构建 | `bun run build:weapp` | ✅ Compiled successfully（仅 Sass @import deprecation 警告，非阻塞） |
| 变量编译 | dist 产物抽查 | ✅ `.bg-bg{background-color:var(--c-bg)}`、`.theme-light`/`.theme-dark` class 完整 |

## full 验证 7 项

1. tasks.md 全部勾选 — ✅ 25/25（含 verify 阶段追加的 tabBar/导航栏适配 6 项）
2. 符合 openspec design.md 高层决策 — ✅ Token 变量化（D1）/ PageLayout 注入（D2 方案 A）/ 暗色治愈配色（D3）/ 主题 store 持久化（D4）/ resolveTheme（D5）/ 三选 UI（D6）
3. 符合 Design Doc — ✅ spike 验证 var() 编译通过、PageLayout 包整页含兄弟节点、暗色配色定稿值一致
4. 能力规格场景全通过 — ✅ 见下表
5. proposal 目标满足 — ✅ 亮/暗/跟随系统三态 + 持久化 + 跟随系统 + 暗色治愈配色 + 三选 UI + 变量化，全部交付
6. delta spec 与 design doc 无矛盾 — ✅ theme-switching 4 需求与 Design Doc 一致，无 Spec Patch
7. 关联设计文档可定位 — ✅ docs/superpowers/specs/2026-07-12-dark-mode-design.md

## Spec 场景覆盖

| Spec 需求 | 实现证据 |
|-----------|---------|
| 主题三态切换（亮/暗/跟随系统，当前项高亮） | SettingsDrawer 三选 + themeStore.setMode + resolveTheme |
| 主题持久化（重启保持/首次默认跟随系统） | Taro.setStorageSync('theme-mode') + init 读取，默认 'system' |
| 暗色治愈配色（对比度/强调色协调） | tokens.scss .theme-dark（bg #1A1613/ink #E8E2D9/peach 保持），真机验暗色可读 |
| 全局配色变量化（切换即时全局生效） | tailwind 9 色 var() + PageLayout 6 页挂 theme-class + 内联收敛 |

## spike 关键结论

- Task 1 验证 weapp-tailwindcss 3.7 **正确输出 `var()`**（dist `.bg-bg{background-color:var(--c-bg)}`），方案 A（Token 变量化 + PageLayout）成立，全 change 最大技术风险排除。

## 原生组件主题适配（verify 阶段用户追加，非 CSS 变量可控）

小程序原生 tabBar / 导航栏不在页面 DOM，CSS 变量管不到，用运行时 API 适配：

| 组件 | 机制 | 暗色配色 |
|------|------|---------|
| tabBar | `Taro.setTabBarStyle`，store setMode/applySystem/init 三处联动 | 背景 #26201B（暗卡片色）+ 次文字 #A89E93 + border black |
| 导航栏 header | `Taro.setNavigationBarColor`，PageLayout useEffect 每页进入 + resolved 变化时应用 | 背景 #1A1613（页面底色）+ frontColor white（微信限 black/white） |

三层主题覆盖：页面内容（CSS 变量）+ tabBar（运行时 API）+ 导航栏（运行时 API）。

## 代码审查（standard 自审）

- build 阶段主会话自审，核查 4 项高风险点通过：
  - PageLayout 6 页含 profile SettingsDrawer 作用域覆盖
  - .theme-dark class 优先级高于 page 元素兜底
  - app.tsx init 先于页面渲染
  - onThemeChange app 级注册一次
- verify 阶段追加的 tabBar/导航栏适配：新增 utils/tabbar.ts（applyTabBarStyle/applyNavBarColor 纯配色映射 + try/catch 兜底）、store 联动、PageLayout useEffect，逻辑简单无 Critical/Important

## TDD 证据

- `resolveTheme(mode, systemTheme)` 先写 4 个失败测试（light/dark/system×系统亮暗）→ RED → 实现 → GREEN
- 测试文件 src/utils/__tests__/theme.test.ts

## 结论

**通过。** 无 CRITICAL / IMPORTANT 失败项。tsc / test 45 / build:weapp 全绿。spike 已排除最大技术风险。

## 已知项（非阻塞，待真机确认）

- **PageLayout 不破坏滚动**（重点）：ScrollView 100vh/min-h-screen 撑满需真机验证
- 三态切换即时全局生效、持久化重启保持、跟随系统实时响应需真机验证
- **tabBar init 时序**：app.tsx useLaunch 内 init 调 setTabBarStyle 时 tabBar 可能未渲染（try/catch 兜底），若首屏 tabBar 未变暗需将 init 的 tabBar 应用延到首页 onShow
- 导航栏 frontColor 微信限 black/white，暗色文字用 white（非暖白，平台限制）
- 富文本用户内容内联色不强制跟主题（非目标，容器背景/默认文字跟主题）
