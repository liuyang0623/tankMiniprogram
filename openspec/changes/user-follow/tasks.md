# Implementation Tasks — user-follow（前端用户关注能力）

## 1. API 与类型扩展

- [x] 1.1 `types/api.ts`：User 补 `followerCount?/followingCount?/isFollowing?`；新增 `FollowUserItem`（id/nickname/avatar/bio/isFollowing）
- [x] 1.2 `services/api/users.ts`：新增 `toggleFollow(id)`、`getFollowers(id,page)`、`getFollowing(id,page)`

## 2. 全局 followStore（TDD）

- [x] 2.1 `store/__tests__/follow.test.ts`：toggle 乐观更新（关注 +1/取关 -1）、后端结果校正、失败回滚、未登录拦截（mock usersApi + authStore）
- [x] 2.2 `store/follow.ts`：followingMap/countsMap + hydrateUser + toggle + isFollowing，实现通过测试
- [x] 2.3 未登录时 toggle 触发 login() 且不发请求

## 3. follow-list 页（粉丝/关注两用）

- [x] 3.1 数据源选择纯函数（type→getFollowers/getFollowing）+ 单测
- [x] 3.2 `pages/follow-list/index`：读 `?userId=&type=`，usePagedList 分页，PageLayout 包裹，空态
- [x] 3.3 `FollowUserRow` 项组件：头像+昵称+简介+关注按钮（读 store，toggle，stopPropagation），点击行进他人主页
- [x] 3.4 列表加载把每项 isFollowing hydrate 进 followStore
- [x] 3.5 app.config.ts 注册页面

## 4. 他人主页 user-profile

- [x] 4.1 `pages/user-profile/index`：读 `?id=`，getUser 拉资料+计数，hydrate store，PageLayout 包裹
- [x] 4.2 头部：头像/昵称/简介 + 获赞/粉丝/关注三计数（粉丝/关注可点进 follow-list）
- [x] 4.3 关注按钮（读 store toggle）+ 私信占位按钮（disabled + showToast）
- [x] 4.4 自己的主页隐藏关注/私信按钮（比对 authStore 当前用户 id）
- [x] 4.5 帖子流：usePagedList(getUserPosts) + PostCard
- [x] 4.6 app.config.ts 注册页面

## 5. 入口接入（4 处头像/昵称跳转）

- [x] 5.1 PostCard 作者头像/昵称加 onClick → user-profile，stopPropagation
- [x] 5.2 detail 页作者信息加跳转
- [x] 5.3 CommentItem 评论者头像/昵称加跳转
- [x] 5.4 回归：卡片/详情原有点击行为不被误触

## 6. 我的页计数入口

- [x] 6.1 profile 页展示关注数/粉丝数（getProfile 或 getUser(self) 拉计数）
- [x] 6.2 点击关注数/粉丝数 → follow-list（userId=self, type）

## 7. 验证

- [x] 7.1 `bun test`（followStore + 纯函数单测）通过
- [x] 7.2 tsc 类型检查通过
- [x] 7.3 weapp 编译通过
- [x] 7.4 真机冒烟：4 入口跳转、关注/取关即时、跨页同步、粉丝/关注列表分页与项内关注、我的页计数入口、自己主页无按钮、未登录关注引导、私信占位提示
