# AGENT.md

给 AI 协作者的**开发前置条件与铁律**。动手前先读这里；技术栈、脚本、目录、设计系统、鉴权模型见 [README.md](./README.md)，本文件不重复，只讲"不看就会踩坑或违规"的部分。

---

## 0. 最高优先级：comet 工作流阶段门

本仓库用 **comet + OpenSpec** 管理需求到归档的全流程。存在活跃 change 时（`openspec/changes/<name>/.comet.yaml` 存在），**每次动手前必须先读 `.comet.yaml` 的 `phase` 字段**，只做当前阶段允许的操作。

| 阶段 | 允许 | 禁止 |
|------|------|------|
| `open` | 建 proposal/design/tasks | 写源码 |
| `design` | brainstorming、写 Design Doc | 写源码 |
| `build` | 写源码、测试、执行计划 | 跳过用户确认点 |
| `verify` | 验证、分支处理 | 跳过失败处理 |
| `archive` | 确认归档、跑归档脚本 | 写源码 |

**硬性规则**（详见 `.claude/rules/comet-phase-guard.md`）：

- **阶段推进只能经 guard/transition 脚本**，禁止手工编辑 `.comet.yaml` 或 `comet-state set phase` 跳阶段。
- 阶段退出跑 `node .comet/skills/skills/comet/scripts/comet-guard.mjs <name> <phase> --apply`，必须看到 `ALL CHECKS PASSED`。
- 归档跑 `node .comet/skills/skills/comet/scripts/comet-archive.mjs <name>`（需先 guard 过 verify→archive）。
- verify 阶段的 **branch handling** 是用户决策点，不能自动填。
- **判断有无活跃 change**：`ls openspec/changes/ | grep -v archive`。为空则无活跃 change——归档后的增量小改直接提交即可，不要凭空新建 change。

> 归档后的零散 UI/bugfix 增量不必开新 change；只有成体量的新特性才走完整 open→archive 流程。

---

## 1. 生成物脚本：改了源必须重跑，产物入 git

有两个**代码生成脚本**，产物已提交进仓库。改了上游**必须重跑**，否则产物与源不一致。

### 图标（iconfont → 组件）
- 源：`iconfont.json` 的 `symbol_url`（iconfont.cn 项目的 symbol JS 地址）。
- 重跑：`node scripts/gen-icons.mjs` → 全量刷新 `src/components/Iconfont/icons.ts`。
- 用法：`<Iconfont name='...' size={20} color='#hex' />`（`src/components/Iconfont/index.tsx`）。运行时把 path 拼成 svg data-uri 渲染。
- **坑**：data-uri svg **不吃 CSS 变量/currentColor**，必须传具体 hex 色值；图标颜色不随亮暗主题自动切换。

### tabBar 图标（icons.ts → PNG）
- 源：`scripts/gen-tabbar-icons.mjs` 里的 `TABBAR_ICONS` 映射。
- 重跑：`node scripts/gen-tabbar-icons.mjs` → 生成 `src/assets/tabbar/*.png`（81×81，未选灰 `#8A7F76` / 选中橙 `#F0A868`）。
- 依赖 **ImageMagick**（`magick` 命令）。
- 该脚本会全量重生成 8 张 png；**提交前用 `git diff --stat` 核对**，只保留真正内容变化的（其余是 mtime 扰动，`git checkout --` 还原），保持提交干净。

---

## 2. 微信小程序硬约束（这些是平台限制，不是选择）

- **原生 tabBar 无法单独隐藏某一项**（`hideTabBar` 是整条隐藏，`setTabBarItem` 只能改文字/图标）。要按登录态动态显隐单个 tab，只能换自定义 tabBar（`custom:true` + 自绘组件）。
- **原生 tabBar 图标只吃本地 PNG**，不支持 svg/字体图标 → 所以有上面的 gen-tabbar-icons 管线。
- **渲染层不支持内联 `<svg>`**、不支持 iconfont 的 Symbol(JS) / 字体图标多色 → 图标统一走 svg data-uri（见 Iconfont 组件）。
- **原生导航栏不受 CSS 变量控制**：主题色用页面级 API（`Taro.setNavigationBarColor`，见 `src/utils/tabbar.ts`）。需要自绘导航栏时设 `navigationStyle: 'custom'`，几何用 `src/utils/navbar.ts` 的 `getNavBarGeom()`（状态栏高度 + 胶囊避让，已抽共享，勿重复造）。
- 运行时**没有 Node 的 `process`**：环境常量走编译期 `TARO_APP_ENV`（见 `src/config/env.ts`）。

---

## 3. 请求分层与鉴权（勿绕过封装）

三层封装，按接口鉴权语义选择，**不要直接裸调 `Taro.request`**：

| 封装 | 用于 | 位置 |
|------|------|------|
| `request` | 底层客户端（baseURL/JWT 注入/解包/规范化错误） | `src/services/request.ts` |
| `authRequest` | **受保护接口**（自动注入 token + 统一 401 处理） | `src/services/authRequest.ts` |
| `optionalAuthRequest` | **可选登录接口**（OptionalJWT 路由，登录则带 token） | `src/services/optionalAuthRequest.ts` |

- **401 统一处理收敛在 `authRequest`**：清登录态 + 全局 toast「登录已失效，请重新登录」。调用方**不要各自传 `onUnauthorized`**，也不要在业务层重复处理 401。
- 后端成功响应形如 `{ code: 200, data, message }`，`request` 解包后返回 `data`。
- 登录是**微信静默登录**（`Taro.login` 换 JWT，`src/services/auth.ts` 的 `login()`），无独立登录页。未登录页面用 `isLogin` 判断 + 引导登录（参考 `pages/messages`、`pages/diary` 的未登录分支范式，保持一致）。

---

## 4. 提交前必过的验证

改动落地后按范围跑（命令用 `bun run` 或直接 `npx` 均可，仓库同时有 `bun.lock` 和 `package-lock.json`）：

```bash
npx tsc --noEmit          # 类型检查，必须 0 错
npx vitest run            # 单元测试，保持全绿
npm run build:weapp       # 微信端构建，必须 EXIT 0
```

- 涉及**鉴权 / 请求层 / store** 等中风险改动，补或更新对应单测（参考 `src/services/__tests__/`）。
- 纯样式/文案等低风险改动，tsc + build 即可，不必强跑全量测试。
- 只有真机/微信开发者工具能确认的效果（自绘导航栏胶囊避让、暗色对比度、tabBar 图标观感），**如实说明"未真机验证"**，不要声称已验证。

---

## 5. Git 约定

- 提交信息用 `<type>(scope): 描述`，type ∈ feat/fix/refactor/docs/test/chore/perf/ci。
- feature 分支合 main 优先 **fast-forward**（历史线性）。
- **提交/推送需用户明确要求**，不要自动 push。

---

## 6. 文档同步：大需求变更必须更新 README

**大的需求内容变更（新增/改动特性、页面、请求层、鉴权、设计系统、目录结构、脚本管线等），必须同步更新 [README.md](./README.md)**，让文档与代码保持一致。

- 判断标准：改动影响到 README 已描述的内容（技术栈、脚本、目录约定、设计系统 token、鉴权模型、后续开发规划等），就要一并更新对应段落。
- 新增了会长期存在的能力（如新脚本、新请求封装、新页面），在 README 相应位置补一行说明。
- 纯 bugfix、小样式微调、局部重构等**不改变对外描述**的改动，不必动 README。
- 若变更同时涉及 AI 铁律（如新的平台约束、新的生成脚本），也要回头更新本文件（AGENT.md）。
- README 更新随同代码改动一起提交，不要拆成事后补文档。

---

## 7. 记忆与状态（跨会话）

- 项目级踩坑与契约记录在 comet 记忆索引（Taro 踩坑、tankService API 契约、原生组件主题化等）。遇到反复出现的坑，先查再动手。
- 怀疑上下文被压缩、找不到之前讨论时，跑 `node .comet/skills/skills/comet/scripts/comet-state.mjs check <name> <phase> --recover` 恢复。
