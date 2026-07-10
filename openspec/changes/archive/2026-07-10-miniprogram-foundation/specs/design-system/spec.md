## ADDED Requirements

### Requirement: 设计 token 体系

系统 SHALL 建立一套基于 ui-ux-pro-max 产出的设计 token，覆盖配色、字号、间距、圆角与阴影，并以可复用变量形式提供给全局样式与组件。token MUST 支撑「新颖、富动效、设计感强」的统一视觉基调。

#### Scenario: 组件消费统一 token

- **WHEN** 任一基础组件引用配色/间距/圆角样式
- **THEN** 该样式 SHALL 来自设计 token，而非页面内硬编码的魔法数值

### Requirement: weapp-tailwindcss 原子化样式

系统 SHALL 集成 weapp-tailwindcss，使 Tailwind 原子类可在小程序 WXSS 环境中生效，作为自绘组件的主要样式手段。

#### Scenario: Tailwind 原子类在小程序端渲染

- **WHEN** 在组件中使用 Tailwind 原子类并编译到微信小程序
- **THEN** 对应样式 SHALL 正确呈现，无未转换的原子类残留

### Requirement: 基础 UI 组件库

系统 SHALL 提供一组自绘基础组件（至少含按钮、卡片、头像、标签、加载态骨架屏），组件遵循设计 token 且可被后续特性页面复用。

#### Scenario: 复用基础组件

- **WHEN** 特性页面引用基础组件并传入内容
- **THEN** 组件 SHALL 按设计 token 渲染且支持基础交互态（如按压反馈）

### Requirement: 动效与转场原语

系统 SHALL 提供可复用的动效原语，至少覆盖页面/元素进场过渡与列表骨架屏加载动画，为「富动效」体验提供统一基础。

#### Scenario: 内容加载展示骨架屏

- **WHEN** 页面数据处于加载中状态
- **THEN** 系统 SHALL 展示骨架屏动画，数据就绪后平滑过渡到真实内容
