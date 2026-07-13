## Why

暗黑模式（已归档 dark-mode）真机发现导航栏 header 主题切换 bug：切换成暗色后，`navigateTo` 进入首页/发布页等其它页面时，导航栏仍显示浅色，未跟随主题。

## 根因

导航栏靠 `PageLayout` 的 `useEffect([resolved])` 调用 `Taro.setNavigationBarColor` 应用。`useEffect` 在组件挂载时执行，此时页面导航栏原生组件可能尚未渲染完成，微信忽略该次调用 → 导航栏保持 `app.config.ts` 的默认浅色。这与 tabBar init 时序是同一类"原生组件 API 早于渲染"问题。

## What Changes

- `PageLayout` 用 Taro 页面级钩子 `useDidShow` 补充导航栏应用时机（页面显示时导航栏已就绪，时机可靠），保留 `useEffect` 覆盖切换即时性 → 双保险
- 修复后：切暗色再进任意页面，导航栏正确显示暗色

## Capabilities

### New Capabilities

<!-- 无。修复已有 theme-switching 能力的实现缺陷，不新增能力。 -->

### Modified Capabilities

<!-- 无。不改变 theme-switching 的 spec 级验收场景（"切换即时全局生效"本就要求导航栏跟随），仅修复实现时序。 -->

## Impact

- **修改**：`src/components/PageLayout/index.tsx`（导航栏应用时机加 useDidShow）
- **后端契约**：无
- **风险**：useDidShow 在子组件的行为——Taro 支持（profile 页已用），绑定宿主页面 onShow
