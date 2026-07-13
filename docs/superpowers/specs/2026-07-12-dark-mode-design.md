---
comet_change: dark-mode
role: technical-design
canonical_spec: openspec
archived-with: 2026-07-13-dark-mode
status: final
---

# dark-mode 技术设计

> 深化 `openspec/changes/dark-mode/design.md`。需求与验收场景以 `specs/theme-switching/spec.md` 为准。本 Doc 聚焦实现方案、暗色配色定稿、data-theme 注入方案、技术风险、测试策略、边界条件。

## 1. 概览

「摆烂随笔」主题系统：亮/暗/跟随系统三态，纯前端。CSS 变量重构 + PageLayout 容器注入主题 class。设置抽屉（profile-settings-drawer）已预留主题占位入口，本次接入。

```
tailwind.config.js  9 色 → var(--c-*)
src/styles/tokens.scss  .theme-light / .theme-dark 两套变量
src/components/PageLayout  容器组件，根 View 挂 theme-{resolved} class
src/store/theme.ts  zustand mode/resolved/setMode + 持久化
src/utils/theme.ts  resolveTheme 纯函数（可测）
src/app.tsx  useLaunch 初始化 + onThemeChange 跟随系统
src/components/SettingsDrawer  主题三选 UI
6 个页面  根节点用 PageLayout 包裹
36 处内联硬编码  → var()
```

## 2. 主题切换机制（核心）

**为何不能改 page 属性**：微信小程序无 document，page 是框架管理的根节点，JS 无法 `setAttribute('data-theme')`。方案 β 不可行。

**方案 A：PageLayout 容器注入 class**
- 封装 `PageLayout`：根 View `className={theme-${resolved}}`，读主题 store 的 resolved
- CSS 变量定义在 `.theme-light` / `.theme-dark` 选择器，`var(--c-*)` 在子树生效
- **PageLayout 必须包整个页面内容**（含兄弟节点如 SettingsDrawer），否则作用域漏

**为何包整页**：CSS 变量作用域限于挂 class 的节点子树。profile 页 `<><ScrollView/><SettingsDrawer/></>`，抽屉是 ScrollView 兄弟，若只包 ScrollView 则抽屉不跟主题。PageLayout 包整个 Fragment 内容。

**PageLayout 不破坏布局**：小程序 `display:contents` 支持不稳，不依赖。PageLayout 用普通 View + `height:100%` + `display:flex; flex-direction:column`，让内部 ScrollView（`height:100vh`/`min-h-screen`）能撑满。

```tsx
// PageLayout 结构（示意）
export default function PageLayout({ children }: { children: ReactNode }) {
  const resolved = useThemeStore((s) => s.resolved)
  return (
    <View className={`theme-${resolved}`} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {children}
    </View>
  )
}
```

## 3. Token 变量化

- `tailwind.config.js` `theme.extend.colors` 9 色改指向 CSS 变量：
```js
colors: {
  bg: 'var(--c-bg)', card: 'var(--c-card)', 'card-soft': 'var(--c-card-soft)',
  peach: 'var(--c-peach)', taro: 'var(--c-taro)', haze: 'var(--c-haze)',
  ink: 'var(--c-ink)', 'ink-sub': 'var(--c-ink-sub)', heart: 'var(--c-heart)',
}
```
- 既有 111 处 `bg-*/text-*` 原子类不动，自动跟随变量
- **build 阶段第一个 spike**：验证 weapp-tailwindcss 3.7 正确输出 `var()` 值（写一个测试类编译检查 dist 产物）。若不支持，退回用 SCSS 变量方案或直接 CSS 类。

## 4. 双套主题变量（tokens.scss）

```scss
.theme-light {
  --c-bg: #FAF6F0; --c-card: #FFFFFF; --c-card-soft: #FEFCF9;
  --c-peach: #F0A868; --c-taro: #E4A9BE; --c-haze: #A6C0CE;
  --c-ink: #4A413A; --c-ink-sub: #8A7F76; --c-heart: #EF8A7F;
  --c-shadow: rgba(74,65,58,0.08);
}
.theme-dark {
  --c-bg: #1A1613; --c-card: #26201B; --c-card-soft: #2E2721;
  --c-peach: #F0A868; --c-taro: #D98FAA; --c-haze: #7E9AA8;
  --c-ink: #E8E2D9; --c-ink-sub: #A89E93; --c-heart: #E87B70;
  --c-shadow: rgba(0,0,0,0.3);
}
```
- `app.scss` `page{}` 基础色也改用 var（或依赖 PageLayout 覆盖）
- shadow token（`boxShadow.soft`）也变量化，暗色阴影更深
- build 阶段检查暗色对比度（ink/bg、ink-sub/card），必要时微调

## 5. 主题 store 与持久化

```ts
// store/theme.ts
type Mode = 'light' | 'dark' | 'system'
type Resolved = 'light' | 'dark'
interface ThemeState {
  mode: Mode
  resolved: Resolved
  setMode: (m: Mode) => void
  applySystem: (sysTheme: Resolved) => void  // onThemeChange 调
}
```
- `setMode`：存 mode，用 `resolveTheme(mode, systemTheme)` 算 resolved，`Taro.setStorageSync('theme-mode', mode)`
- 初始化（app.tsx useLaunch）：读 `getStorageSync('theme-mode')`（默认 'system'）+ `Taro.getSystemInfoSync().theme`，算 resolved；`Taro.onThemeChange(({theme}) => applySystem(theme))` app 级注册一次
- system 模式下 applySystem 更新 resolved；非 system 忽略系统变化

## 6. 主题解析纯函数（可测）

```ts
// utils/theme.ts
export function resolveTheme(mode: Mode, systemTheme: Resolved): Resolved {
  return mode === 'system' ? systemTheme : mode
}
```
单测：light→light、dark→dark、system+dark→dark、system+light→light。

## 7. 设置抽屉三选 UI

- SettingsDrawer 主题入口从占位（禁用「即将上线」）改为三个可选项：亮 / 暗 / 跟随系统
- 读 `themeStore.mode` 高亮当前项，点击 `setMode`
- 移除原占位的 `opacity:0.5` 与「即将上线」

## 8. 内联硬编码收敛

- 全量 grep 清点 36 处内联十六进制（如 `style={{color:'#E4A9BE'}}`）
- 逐个改为 `var(--c-taro)` 等变量引用，或改用 Tailwind 类
- 验证阶段回归亮色视觉与现状一致

## 9. 测试策略

- **单元（vitest）**：`resolveTheme`（4 组：light/dark/system×sys亮暗）
- **tsc + weapp 编译**
- **spike**：weapp-tailwindcss var() 编译输出验证（build 第一步）
- **真机冒烟**：三态切换即时全局生效、持久化重启保持、跟随系统实时响应（切系统深色）、暗色各页面文字可读、强调色协调、SettingsDrawer/详情/富文本容器适配、PageLayout 不破坏 ScrollView 滚动与高度

## 10. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 小程序无法改 page 属性 | PageLayout 容器挂主题 class（方案 A），确定可行 |
| CSS 变量作用域限子树 | PageLayout 包整页含兄弟节点 |
| display:contents 支持不稳 | 普通 View + height/flex 透传，不依赖 contents |
| weapp-tailwindcss var() 编译不支持 | build 第一个 spike 验证；不支持退 SCSS 变量/CSS 类方案 |
| PageLayout 破坏 ScrollView 高度 | height:100% + flex 透传，冒烟验证滚动 |
| 36 处内联遗漏 | 全量 grep 清点，验证回归 |
| 富文本用户内容内联样式不跟主题 | 容器背景/默认文字跟主题，用户 HTML 内联色不强制（非目标） |
| system 监听泄漏/重复 | onThemeChange app 级注册一次 |

## 11. 非目标（YAGNI）

不改 go-service；不做多主题/自定义主题；不做每页独立主题；富文本用户内容内联色不强制跟主题；不做主题切换过渡动画（即时切换）。

