# Implementation Tasks — dark-mode

## 1. 技术验证（spike）

- [ ] 1.1 验证 weapp-tailwindcss 3.7 对 `var(--c-*)` 颜色的编译输出（一个测试类）
- [ ] 1.2 验证小程序运行时切换主题的方案：优先 page[data-theme] 全局注入（方案 β），不可行退每页根 View 挂 data-theme（方案 α）
- [ ] 1.3 确定最终 data-theme 注入方案，记录到 design.md

## 2. Token 变量化与双套配色

- [ ] 2.1 `tailwind.config.js` 9 色改指向 `var(--c-*)`
- [ ] 2.2 `tokens.scss` 定义亮色变量（`page`）+ 暗色变量（`page[data-theme=dark]`），暗色值按 design D3
- [ ] 2.3 `app.scss` `page{}` 基础背景/文字色改用变量
- [ ] 2.4 验证亮色表现与现状一致（值不变）

## 3. 主题 store 与解析纯函数（TDD）

- [ ] 3.1 `resolveTheme(mode, systemTheme)` 纯函数 + 单测（先测后码）
- [ ] 3.2 `store/theme.ts`：mode/resolved/setMode，`Taro.setStorageSync` 持久化
- [ ] 3.3 `app.tsx` useLaunch 初始化：读持久化 mode，取系统 theme，注册 `onThemeChange`

## 4. 运行时切换接入

- [ ] 4.1 按选定方案（α/β）接入 data-theme 注入，切换即时全局生效
- [ ] 4.2 system 模式跟随系统深浅色，onThemeChange 实时更新

## 5. 内联硬编码收敛

- [ ] 5.1 全量清点 36 处内联十六进制色值，逐个改 CSS 变量引用
- [ ] 5.2 回归：亮色下各页面视觉与现状一致

## 6. 设置抽屉主题三选 UI

- [ ] 6.1 SettingsDrawer 主题入口从占位改为亮/暗/跟随系统三选，当前项高亮
- [ ] 6.2 点击切换调用 themeStore.setMode

## 7. 验证

- [ ] 7.1 单元测试：resolveTheme 纯函数
- [ ] 7.2 tsc 类型校验 + weapp 编译通过
- [ ] 7.3 真机冒烟：三态切换即时生效、持久化重启保持、跟随系统实时响应、暗色各页面可读、强调色协调、富文本详情容器适配
