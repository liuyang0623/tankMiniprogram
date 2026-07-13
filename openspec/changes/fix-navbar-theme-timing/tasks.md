# Implementation Tasks — fix-navbar-theme-timing

## 1. 修复导航栏应用时机

- [ ] 1.1 `PageLayout` 引入 `useDidShow`，新增 `useDidShow(() => applyNavBarColor(resolved))`，保留原 useEffect
- [ ] 1.2 tsc + weapp 编译通过
- [ ] 1.3 真机冒烟：切暗色后 navigateTo 各页面导航栏均正确跟随主题
