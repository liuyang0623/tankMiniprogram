## Why

后端关注能力（follow change）已上线：关注/取关、粉丝/关注列表、用户详情带计数接口就绪。但前端还没有任何入口——用户无法查看他人主页、无法关注/取关、看不到自己的关注/粉丝数。本 change 补齐前端社交关系闭环，让「摆烂随笔」从单向内容浏览走向用户互相关注的社区。

## What Changes

- **新建他人主页** `pages/user-profile`：展示目标用户头像/昵称/简介、获赞数、粉丝数（可点→粉丝列表）、关注数（可点→关注列表）、关注/取关按钮、私信按钮（占位禁用）、以及该用户已发布内容列表（复用 PostCard + usePagedList）
- **新建关注/粉丝列表页** `pages/follow-list`：一个页面按参数（followers/following + userId）两用，展示用户项 + 各项关注按钮，点击项进入对应他人主页
- **新增全局 follow store**（zustand）：缓存关注关系与计数，关注/取关操作即时全局同步（信息流、他人主页、列表页、我的页多处一致）
- **扩展 users API**：`toggleFollow(id)`、`getFollowers(id, page)`、`getFollowing(id, page)`；`getUser` 返回类型补充 `followerCount/followingCount/isFollowing`
- **4 处入口接头像/昵称跳转**：信息流帖子卡片（PostCard）、帖子详情页作者、评论区用户、粉丝/关注列表项 → 他人主页
- **「我的」页 profile 扩展**：展示关注数 / 粉丝数，点击 → 关注列表 / 粉丝列表页
- **私信按钮占位**：他人主页私信按钮禁用态 + 点击「私信功能即将上线」提示（本体在后续 change③④）

## Capabilities

### New Capabilities
- `user-follow-ui`: 前端用户关注社交能力——他人主页浏览、关注/取关交互与全局状态同步、粉丝/关注列表、我的页关注计数入口

### Modified Capabilities
<!-- 无既有前端 spec 的需求变更；本项目 openspec/specs 下无对应前端能力 spec -->

## Impact

- **新增页面**：`src/pages/user-profile/`、`src/pages/follow-list/`（app.config.ts 注册）
- **新增 store**：`src/store/follow.ts`
- **修改 API**：`src/services/api/users.ts`（+toggleFollow/getFollowers/getFollowing），`src/types/api.ts`（User 补计数字段 + FollowUserItem 类型）
- **修改入口**：`src/components/PostCard`（作者头像/昵称可点）、`pages/detail`（作者信息可点）、`src/components/CommentItem`（评论者可点）、`pages/profile`（关注/粉丝计数入口）
- **依赖**：无新增第三方依赖；复用现有 request/authRequest、PageLayout、Avatar、PostCard、usePagedList
- **后端**：零改动（follow change 接口已就绪）
