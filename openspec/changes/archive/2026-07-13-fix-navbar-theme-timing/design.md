## Context

dark-mode 已归档，真机暴露导航栏时序 bug。修复限于 `PageLayout` 导航栏应用时机，不动其它。

## 修复方案

`PageLayout` 当前只用 `useEffect([resolved])` 调 `applyNavBarColor`。问题：useEffect 挂载时导航栏原生组件未就绪，`setNavigationBarColor` 被忽略。

**方案：useDidShow + useEffect 双保险**
- 保留 `useEffect([resolved])`：覆盖"停留在当前页时切换主题"的即时性
- 新增 `useDidShow(() => applyNavBarColor(resolved))`：覆盖"navigateTo/切回页面时"的可靠时机——页面显示时导航栏已渲染，API 生效
- `useDidShow` 是 Taro 页面级钩子，PageLayout 作为页面根容器子组件可用（profile 页已用），绑定宿主页面 onShow

```tsx
import { useDidShow } from '@tarojs/taro'
// ...
const resolved = useThemeStore((s) => s.resolved)
useEffect(() => { applyNavBarColor(resolved) }, [resolved])
useDidShow(() => { applyNavBarColor(resolved) })
```

**为何不改 tabBar**：tabBar 是全局组件，store 层 setMode/applySystem/init 已联动应用，切换时全局生效，无此页面级时序问题。导航栏是页面级 API，才需要每页 onShow 重设。

## 边界

- useDidShow 读的 resolved 是闭包捕获值——但每次页面显示时组件重渲染，resolved 为最新，无过期问题
- 不改暗色配色、不改 store、不改其它页面

## 测试

- tsc + weapp 编译
- 真机冒烟：切暗色 → navigateTo 首页/发布页/详情 → 导航栏均为暗色；切回亮色同理；跟随系统切换后进页面导航栏正确
