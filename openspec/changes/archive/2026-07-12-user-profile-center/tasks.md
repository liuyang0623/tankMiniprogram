# Implementation Tasks — user-profile-center

## 1. API 与类型

- [x] 1.1 `types/api.ts` 补收藏包裹类型 `FavoriteItem { post: Post; favoritedAt: string }`、`PaginatedFavorites`
- [x] 1.2 `services/api/users.ts` 确认 `getProfile`/`updateProfile(部分字段)` 签名；`interactions.ts` 确认 `getFavorites` 返回分页
- [x] 1.3 收藏解包工具：从 `{post, favoritedAt}[]` 提取 `post[]`

## 2. 个人中心页（profile-center）

- [x] 2.1 资料卡：头像/昵称/简介 + 编辑入口（已登录）
- [x] 2.2 未登录入口：登录按钮，走 login，成功刷新
- [x] 2.3 Tab 切换「我的帖子｜我的收藏」组件
- [x] 2.4 我的帖子 Tab：`usePagedList(postsApi.findMyPosts)` + PostCard + 空态
- [x] 2.5 我的收藏 Tab：`usePagedList(收藏解包)` + PostCard + 空态
- [x] 2.6 Tab 懒加载（首次进入才请求，切回不重复）

## 3. 资料编辑页（profile-edit）

- [x] 3.1 新增 `pages/profile-edit`（注册路由），表单：昵称/简介/性别
- [x] 3.2 头像选择 + 上传：`Taro.chooseImage` → `uploadApi.uploadImage` → 预览
- [x] 3.3 保存：`usersApi.updateProfile(变更字段)` → 更新 authStore → 返回
- [x] 3.4 保存/上传失败提示

## 4. 验证

- [x] 4.1 单元测试：收藏解包工具、变更字段收集逻辑
- [x] 4.2 tsc 类型校验 + weapp 编译通过
- [x] 4.3 微信开发者工具冒烟：个人中心资料、Tab 切换、编辑保存、头像上传、我的帖子/收藏（真机验证收藏 post 字段是否匹配）
