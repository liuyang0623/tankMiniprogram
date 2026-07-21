## Why

灵感 tab「解惑广场」的提问 / 回答富文本编辑器（`RichEditor`）在暗色模式下未适配：工具栏按钮、更多面板按钮仍是浅色底 + 深色字，编辑器正文区仍是纯白底。暗色模式下这块输入区刺眼、与整页暗色割裂。

## 根因

项目暗色主题靠 `PageLayout` 挂 `.theme-dark` class，令 `--c-*` CSS 变量在整页子树生效，组件统一用 `var(--c-*)` 取色即可自动跟随主题。

`src/components/RichEditor/index.scss` 是唯一漏网：它把颜色写死成浅色字面量而非引用主题变量——

- `.editor-toolbar .tool-btn`：`background: #faf6f0`、`.tool-txt color: #4a4038`
- `.more-panel .panel-btn`：`background: #faf6f0`、`.panel-btn-txt color: #4a4038`
- `.editor-body`：`background: #ffffff`

写死值不随 `.theme-dark` 变化，故暗色下保持浅色。灵感 tab 其余页面（qa/qa-detail/sport/food/fortune/index）与 CheckinCalendar、BottomSheet 均已正确使用 `var(--c-*)`，页面里的 `#fff` 都是橙底按钮/徽章上的白字，主题无关，无需改动。

## What Changes

- `RichEditor/index.scss` 三处写死浅色改为主题变量：
  - 工具栏 / 面板按钮底色 `#faf6f0` → `var(--c-card-soft)`
  - 按钮文字 `#4a4038` → `var(--c-ink)`
  - 编辑器正文底色 `#ffffff` → `var(--c-card)`
- 修复后：暗色模式下打开提问 / 回答编辑器，工具栏、面板、正文区均为暗色，跟随整页主题。

## Capabilities

### New Capabilities

<!-- 无。修复已有富文本编辑器组件的暗色适配缺陷，不新增能力。 -->

### Modified Capabilities

<!-- 无。不改变任何 spec 级验收场景，仅修复组件样式取色实现。 -->

## Impact

- **修改**：`src/components/RichEditor/index.scss`（3 处写死颜色改用 `var(--c-*)`）
- **后端契约**：无
- **风险**：极低。仅样式取色改动，不涉及结构 / 逻辑 / 接口；`--c-card-soft`/`--c-ink`/`--c-card` 在 light/dark 两套 token 中均已定义。
