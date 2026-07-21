## Context

灵感 tab 四板块已上线并归档（inspiration-frontend-tab / inspiration-backend-api）。暗色模式（dark-mode）也已归档。真机 / 预览在暗色下发现「解惑广场」提问、回答的富文本编辑器未适配暗色。修复限于 `RichEditor/index.scss` 取色方式，不动结构与其它组件。

## 修复方案

暗色主题机制：`PageLayout` 根 View 挂 `.theme-{resolved}`，`src/styles/tokens.scss` 定义 `.theme-light`/`.theme-dark` 两套 `--c-*` 变量，子树组件用 `var(--c-*)` 即自动跟随。`RichEditor` 是唯一写死浅色的组件。

**方案：三处写死颜色改用主题变量**（与 CheckinCalendar / BottomSheet / qa 系列一致的取色约定）

| 选择器 | 现值（写死浅色） | 改为 | 说明 |
|--------|------------------|------|------|
| `.tool-btn` / `.panel-btn` 底色 | `#faf6f0` | `var(--c-card-soft)` | 卡片弱化底，light=#fefcf9 / dark=#2e2721 |
| `.tool-txt` / `.panel-btn-txt` 文字 | `#4a4038` | `var(--c-ink)` | 主墨色，light=#4a413a / dark=#e8e2d9 |
| `.editor-body` 底色 | `#ffffff` | `var(--c-card)` | 卡片底，light=#ffffff / dark=#26201b |

```scss
.tool-btn      { background: var(--c-card-soft); }
.tool-txt      { color: var(--c-ink); }
.panel-btn     { background: var(--c-card-soft); }
.panel-btn-txt { color: var(--c-ink); }
.editor-body   { background: var(--c-card); }
```

**为何选这三个变量**：`#faf6f0` 恰是 light 的页面底 `--c-bg`，但在编辑器里它是「按钮相对正文的弱化底」，语义上对应 `--c-card-soft` 更贴切（light 下视觉接近，dark 下有正确层次）；`#ffffff` 是 light 的 `--c-card`；`#4a4038` 约等于 `--c-ink`（light #4a413a）。三者在两套 token 均已定义，无需新增变量。

## 边界

- 只改 `RichEditor/index.scss` 一个文件；`EditorToolbar.tsx`/`MorePanel.tsx`/`index.tsx` 不动。
- MorePanel 的色板 `COLORS`（写死品牌色圆点）是「用户可选的文字/背景色」内容值，非主题皮肤，保持不变。
- `.color-dot` 无背景写死问题（内联 style 由数据驱动）。
- 不改暗色配色 token、不改其它页面。

## 测试

- `tsc` + `build:weapp` 编译通过（样式改动不影响类型，但走一遍构建确保 SCSS 合法）
- 手动验证：切暗色 → 灵感 → 解惑 → 提问 / 进入某问题回答 → 工具栏、更多面板、正文区均为暗色底、浅色字；切回亮色同样正常。
