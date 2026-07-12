# profile-settings-drawer Specification

## Purpose
TBD - created by archiving change profile-and-experience-polish. Update Purpose after archive.
## Requirements
### Requirement: 设置抽屉入口

系统 SHALL 在个人中心提供设置入口，点击后从屏幕右侧滑入全屏抽屉，抽屉外区域（遮罩）可点击关闭。

#### Scenario: 打开设置抽屉

- **WHEN** 用户在个人中心点击设置入口
- **THEN** 系统 SHALL 从右侧滑入全屏抽屉，并展示遮罩

#### Scenario: 关闭设置抽屉

- **WHEN** 用户点击遮罩或关闭按钮
- **THEN** 系统 SHALL 收起抽屉

### Requirement: 抽屉内容项

系统 SHALL 在设置抽屉内自上而下展示：主题切换入口、草稿箱入口、退出登录（置于最底部）。原个人中心页面底部的退出登录与 Tab 上方的草稿箱入口 SHALL 迁移进抽屉，不再散落在页面中。

#### Scenario: 抽屉展示操作项

- **WHEN** 设置抽屉打开
- **THEN** 系统 SHALL 展示主题切换入口、草稿箱入口、退出登录三项，退出登录位于最底部

#### Scenario: 进入草稿箱

- **WHEN** 用户点击抽屉内草稿箱入口
- **THEN** 系统 SHALL 跳转草稿箱页

#### Scenario: 主题切换入口占位

- **WHEN** 用户点击抽屉内主题切换入口
- **THEN** 系统 SHALL 以占位形式呈现（暂不切换主题，暗黑模式由后续 change 接入），不产生错误

### Requirement: 抽屉内退出登录

系统 SHALL 在抽屉底部提供退出登录，二次确认后登出并回到未登录态。

#### Scenario: 退出登录

- **WHEN** 用户点击抽屉内退出登录并确认
- **THEN** 系统 SHALL 清除登录态并回到未登录展示

