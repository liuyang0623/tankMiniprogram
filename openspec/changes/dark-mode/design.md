## Context

「摆烂随笔」主题系统，纯前端。设置抽屉（`profile-settings-drawer`）已预留主题占位入口。目标是让用户手动切换亮/暗/跟随系统，暗色保持治愈调性。

现状核对：
- 颜色写死在 `tailwind.config.js` `theme.extend.colors`（9 色），编译成静态原子类，111 处 `bg-*/text-*` 使用
- `app.scss` `page{}` 写死 `#faf6f0`/`#4a413a`
- 36 处组件内联 `style` 硬编码色值（如 `#E4A9BE`）
- `app.tsx` 有 `useLaunch`（主题初始化挂载点），`useAuthStore` 已在入口使用
- 技术栈：Tailwind 3.4 + weapp-tailwindcss 3.7，Taro 4.2

## Goals / Non-Goals

**Goals:** 亮/暗/跟随系统三态、本地持久化、跟随系统深浅色、暗色治愈配色、设置抽屉三选 UI、颜色体系变量化。

**Non-Goals:** 不改 go-service；不做多主题/自定义主题；不做每页独立主题；富文本用户内容内联样式不强制跟随主题（尽力适配容器）。

## Decisions

**D1. Token 变量化（核心）**
- `tailwind.config.js` 颜色改指向 CSS 变量：`peach: 'var(--c-peach)'` 等 9 色。既有 111 处原子类不动，自动跟随变量。
- `tokens.scss` 定义两套变量：`page { --c-bg:#FAF6F0; ... }`（亮）、`page[data-theme="dark"] { --c-bg:#1A1613; ... }`（暗）。
- 需验证 weapp-tailwindcss 3.7 是否正确输出 `var()` 值（design 阶段做最小验证）。

**D2. 运行时切换 data-theme（最大技术风险）**
- 小程序无 DOM，不能 `document.setAttribute`。候选方案，design 阶段验证后择一：
  - 方案 α：`Taro.setStorageSync` + 页面根节点绑定 `data-theme={theme}`（React state 驱动），每页根 View 读主题 store。改动面广但确定可行。
  - 方案 β：全局 `page` 选择器 + 某种全局属性注入（如 `Taro.setPageStyle` 或 app 级样式类）。改动小但可行性需验证。
- **验证优先**：design 阶段先写最小 spike 确认 β 是否可行；不可行则采用 α。

**D3. 暗色配色（治愈系推导）**
- 亮 → 暗映射（保持治愈调性，暖色偏移）：
  - bg `#FAF6F0` → `#1A1613`（深棕黑）
  - card `#FFFFFF` → `#26201B`（深卡片）
  - card-soft `#FEFCF9` → `#2E2721`
  - ink `#4A413A` → `#E8E2D9`（暖白）
  - ink-sub `#8A7F76` → `#A89E93`
  - peach `#F0A868` → `#F0A868`（强调色保持，深底上仍协调）或微调 `#E8A265`
  - taro `#E4A9BE` → `#D98FAA`
  - haze `#A6C0CE` → `#7E9AA8`
  - heart `#EF8A7F` → `#E87B70`
- 具体值 design 阶段定稿并检查对比度。

**D4. 主题 store + 持久化**
- `src/store/theme.ts`（zustand）：`mode: 'light'|'dark'|'system'`、`resolved: 'light'|'dark'`（system 解析后的实际主题）、`setMode`。
- 持久化用 `Taro.setStorageSync('theme-mode', mode)`；`app.tsx` `useLaunch` 读取初始化。
- `system` 模式：`Taro.getSystemInfoSync().theme` 取初值，`Taro.onThemeChange` 监听系统切换更新 resolved。

**D5. 主题解析纯函数（可测）**
- `resolveTheme(mode, systemTheme): 'light'|'dark'` —— system→跟随 systemTheme，否则用 mode。单测。

**D6. 设置抽屉三选 UI**
- 主题入口从占位改为三个可选项（亮/暗/跟随系统），当前 resolved/mode 高亮，点击 `themeStore.setMode`。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 小程序运行时改 page data-theme 不可行 | design 阶段 spike 验证 β；不可行退方案 α（每页根 View 挂 data-theme） |
| weapp-tailwindcss 对 var() 编译支持 | design 阶段最小验证一个变量色类 |
| 36 处内联硬编码遗漏 | 全量 grep 清点，逐个改 var()；验证阶段回归 |
| 富文本内容内联样式不跟主题 | 容器背景/默认文字色跟主题，用户 HTML 内联色不强制（非目标） |
| system 模式监听泄漏 | onThemeChange 在 app 级注册一次，避免重复 |

## Migration Plan

无破坏性变更。颜色变量化后亮色表现与现状一致（值不变），暗色为新增。

## Open Questions

- 方案 α vs β（data-theme 注入方式）——design 阶段 spike 后定
- peach 强调色暗色下是否微调——design 阶段看对比度
- 默认主题：跟随系统 vs 亮色——倾向跟随系统

> spike 结论（Task 1）：weapp-tailwindcss 3.7 编译 `var(--c-*)` 颜色 —— **通过**。dist 产物 `.bg-bg{background-color:var(--c-bg)}` 验证于 2026-07-12，方案 A（Token 变量化 + PageLayout）成立，无需切备选。
