# tabbar-icons Specification

## ADDED Requirements

### Requirement: TabBar 图标

系统 SHALL 为底部 TabBar 三个 tab（首页/消息/我的）提供本地 PNG 图标，未选中态灰色、选中态奶橘色。

#### Scenario: 未选中图标

- **WHEN** tab 未被选中
- **THEN** 系统 SHALL 显示灰色（#8A7F76）图标

#### Scenario: 选中图标

- **WHEN** tab 被选中
- **THEN** 系统 SHALL 显示奶橘色（#F0A868）图标
