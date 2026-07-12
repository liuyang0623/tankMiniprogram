# Implementation Tasks — profile-and-experience-polish

## 1. 详情页结构化骨架屏（experience-polish）

- [ ] 1.1 新增 `DetailSkeleton` 组件（标题条 + 头像行 + 正文块），复用 Skeleton token
- [ ] 1.2 详情页 `pages/detail` 加载态替换 `<Skeleton rows={6}>` 为 `DetailSkeleton`

## 2. 草稿删除按钮内移（experience-polish）

- [ ] 2.1 `PostCard` 增加可选 action（右上角 slot/renderAction），不传时行为不变
- [ ] 2.2 草稿箱 `pages/drafts` 删除按钮移入卡片内部，点击 stopPropagation 不触发跳转
- [ ] 2.3 回归：信息流/我的帖子卡片不受影响

## 3. 发布 401 登录过期优化（experience-polish）

- [ ] 3.1 发布页 `submit` catch 判断 `err.code === 401`：提示登录过期 + 引导 login，保留 title/正文
- [ ] 3.2 自动保存 `useDraftAutosave` 401：转提示态（不弹窗），SaveStatus 显示登录过期，保留内容
- [ ] 3.3 纯函数/工具：401 判断逻辑抽取可测（如 `isUnauthorized(err)`）

## 4. 设置抽屉组件（profile-settings-drawer）

- [ ] 4.1 新增 `SettingsDrawer` 组件：全屏遮罩 + 右侧滑入面板（transform/opacity 动效，遮罩阻止穿透）
- [ ] 4.2 抽屉内容：主题切换入口（占位）、草稿箱入口（navigateTo）、退出登录（置底 + 二次确认）
- [ ] 4.3 遮罩/关闭按钮收起抽屉

## 5. 个人中心接入抽屉（profile-settings-drawer）

- [ ] 5.1 个人中心加设置按钮（右上角），打开 SettingsDrawer
- [ ] 5.2 移除页面底部退出登录、Tab 上方草稿箱入口（迁移进抽屉）
- [ ] 5.3 回归：登录/未登录态展示正常

## 6. 验证

- [ ] 6.1 单元测试：401 判断纯函数（如有抽取）
- [ ] 6.2 tsc 类型校验 + weapp 编译通过
- [ ] 6.3 微信开发者工具/真机冒烟：详情骨架、草稿卡片内删除、发布/自动保存 401 提示、设置抽屉滑入/关闭、抽屉三项入口、退出登录
