## Why

「摆烂随笔」已在设置抽屉预留主题切换入口（当前为占位「即将上线」），但缺少主题系统本身。用户希望能手动切换亮色/暗色，或跟随系统深浅色。本变更实现完整的主题系统，接上占位入口。纯前端，不改 go-service。

现状障碍：颜色目前在 `tailwind.config.js` 写死十六进制、`app.scss` 与 36 处组件内联硬编码，编译期烧进静态 CSS，运行时无法切换。需将颜色体系变量化。

## What Changes

- **Token 变量化**：`tailwind.config.js` 颜色由写死十六进制改为指向 CSS 变量（`var(--c-*)`），既有 111 处 `bg-*/text-*` 原子类自动跟随主题，无需逐个改
- **双套主题变量**：`tokens.scss` 定义亮色（现有治愈系）与暗色（基于治愈系推导的深色）两套 CSS 变量
- **主题 store**：新增 zustand 主题 store，存 `'light' | 'dark' | 'system'`，本地持久化，重启保持
- **运行时切换**：切换主题时更新 `page` 的 `data-theme`（小程序无 DOM，采用 design 阶段验证的方案）
- **跟随系统**：`system` 模式读系统深浅色并监听 `onThemeChange` 实时响应
- **内联硬编码收敛**：36 处组件内联十六进制色值改为 CSS 变量引用
- **主题切换 UI**：设置抽屉主题入口从占位改为「亮 / 暗 / 跟随系统」三选，当前项高亮

## Capabilities

### New Capabilities

- `theme-switching`: 主题系统——亮/暗/跟随系统三态切换、本地持久化、跟随系统深浅色、暗色治愈配色、设置抽屉主题选择 UI

### Modified Capabilities

<!-- 无。设置抽屉的主题入口在 profile-settings-drawer 已作为占位存在，本次接入切换逻辑属实现细化，不改其 spec 级需求。 -->

## Impact

- **修改**：`tailwind.config.js`（颜色指向 CSS 变量）、`src/styles/tokens.scss`（双套变量）、`src/app.scss`（page 基础色变量化）、`src/app.tsx`（启动初始化主题）、`src/components/SettingsDrawer`（主题三选 UI）
- **新增**：`src/store/theme.ts`（主题 store + 持久化）、可能 `src/utils/theme.ts`（主题解析纯函数）
- **收敛**：36 处组件内联硬编码色值 → CSS 变量
- **后端契约（无需改动）**：纯前端主题
- **技术风险**：小程序运行时改 `page` data-theme 可行性（design 阶段验证性实现确认；若不可行退到每页根 View 挂 data-theme 备选）；weapp-tailwindcss 3.7 对 `var()` 颜色编译支持；富文本内容深色适配
