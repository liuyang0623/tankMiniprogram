# 验证报告 — article-publish-richtext

- Change: article-publish-richtext
- 验证级别: full（任务 20 / 能力 2 / 变更文件 24，均超阈值）
- 日期: 2026-07-12
- 分支: feature/20260712/article-publish-richtext
- base-ref: 5844047

## 验证证据（新鲜运行）

| 检查项 | 命令 | 结果 |
|--------|------|------|
| 类型检查 | `bunx tsc --noEmit` | ✅ exit 0 |
| 单元测试 | `bun run test` | ✅ 36/36 passed（9 文件；含新增 publish.test.ts 11 例：firstImage 3 / parseTopics 4 / extractImagesInOrder 2 / canPersistDraft 2） |
| 构建 | `bun run build:weapp` | ✅ Compiled successfully（仅 Sass `@import` deprecation 警告，非阻塞） |
| 安全 | 硬编码密钥扫描 | ✅ 无 |

## full 验证 7 项

1. tasks.md 全部勾选 — ✅ 20/20
2. 符合 openspec design.md 高层决策 — ✅ 官方 `<editor>`（D1）/ 草稿 id 生命周期+debounce（D2）/ 封面取首图（D3）/ 话题收集（D4）/ 编辑复用发布页（D5）/ 草稿箱（D6）/ 契约修正（D7）
3. 符合 Design Doc — ✅ RichEditor(EditorContext+分层工具栏)、useDraftAutosave(串行化竞态)、firstImage/parseTopics 纯函数、发布 tab 两用一致
4. 能力规格场景全通过 — ✅ 见下表
5. proposal 目标满足 — ✅ 富文本发布闭环（编辑器+发布+话题+草稿+草稿箱+编辑已有帖子）交付，纯前端后端零改动
6. delta spec 与 design doc 无矛盾 — ✅ 2 能力（article-publish 7 需求 / post-drafts 4 需求）与 Design Doc 一致；Spec Patch（分层工具栏、保存状态展示）已在 design 阶段回写
7. 关联设计文档可定位 — ✅ docs/superpowers/specs/2026-07-12-article-publish-richtext-design.md

## Spec 场景覆盖

| Spec | 验收要点 | 实现证据 |
|------|---------|---------|
| article-publish | 富文本编辑器/图片插入/分层工具栏/发布/话题/封面取首图/编辑已有/未登录拦截 | RichEditor(Editor+EditorContext+EditorToolbar+MorePanel)；chooseImage→upload→insertImage；create(PUBLISHED)/publish；parseTopics；firstImage；update 不传 status 保持 PUBLISHED；login 拦截 |
| post-drafts | 自动保存/首次创建/后续更新/节流/状态字/草稿箱/继续编辑/删除 | useDraftAutosave(draftId 生命周期+debounce 1800ms+串行化)；SaveStatus 状态字；pages/drafts(usePagedList+PostCard)；publish?id= 回填；remove 二次确认 |

## 代码审查（build 阶段 standard）

- build 阶段已对整个 change diff 完成 standard 审查，发现并修复 6 个问题（3 Critical + 3 Important）：
  - Critical：草稿竞态重复建帖/孤儿草稿（串行化 inFlightRef）；create 失败锁死（去除易锁的 creatingRef 改 promise 链）；闭包读过期 draftId（flush 返回最终 id）
  - Important：回填期间空 html 覆盖草稿（backfillingRef gate）；回填触发冗余 update（gate 跳过）；timer 与 flush 并发（串行化）
  - 提交：`ac58b34 fix(publish): 代码审查修复草稿竞态`
- verify 去重：build 后新增的仅为真机冒烟 bug 修复（见下），已 TDD 覆盖，不重复评审

## verify 阶段真机冒烟发现并修复的缺陷

真机验证发现 1 个缺陷，根因确证并修复，用户已复验通过：

| 问题 | 根因 | 修复 | 归属 |
|------|------|------|------|
| 只写标题、正文空时自动保存报 400 content is required | 空草稿防护是「标题空 AND 正文空才跳过」，与后端 content 必填契约冲突 | 新增 `canPersistDraft(text)` 纯函数，正文为空一律不保存（覆盖 create/update）+ 补单测防回归 | 前端（`d91b183`） |

修复走 verify-fail 回退 build → TDD（先测后码）→ tsc/test/build 全绿 → 重过 build guard，用户真机复验通过。

## TDD 证据

- 纯函数先测后码：firstImage/parseTopics/extractImagesInOrder（初版）、canPersistDraft（bug 修复）
- 测试文件 `src/utils/__tests__/publish.test.ts`（11 例），均通过

## 结论

**通过。** 无 CRITICAL / IMPORTANT 失败项。tsc / test 36 / build:weapp 全绿。真机冒烟缺陷已修复复验。

## 已知项（非阻塞）

- 微信 `<editor>` 富文本编辑、分层工具栏、图片插入、颜色/字号 format 依赖真机，开发者工具支持不完整；核心路径用户已真机冒烟
- 自动保存/竞态/草稿箱/编辑已发布帖子等交互已真机验证核心场景通过
