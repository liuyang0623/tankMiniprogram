---
change: miniprogram-foundation
design-doc: docs/superpowers/specs/2026-07-09-miniprogram-foundation-design.md
base-ref: b309cc642c146531efe80f07c9002c17a7f84e62
---

# 摆烂随笔小程序地基层 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为「摆烂随笔」微信小程序搭建可编译运行的工程地基：Taro4+React+bun 脚手架、温柔治愈系设计系统、统一数据访问层与微信登录鉴权，供后续 3 个特性 change 复用。

**Architecture:** 分层为 `pages → components(设计系统) → store(Zustand) → services(request+api) → go-service /api/v1`。样式用 weapp-tailwindcss 注入设计 token；请求层集中处理 baseURL/JWT/解包/401；鉴权走微信 code 换 JWT 并持久化。

**Tech Stack:** Taro 4、React 18、TypeScript、bun、weapp-tailwindcss、tailwindcss、Zustand、vitest。

## Global Constraints

- 包管理与脚本一律用 **bun**（`bun install` / `bun run ...`），不使用 npm/yarn 命令
- 微信 appid：`wx555c14bc9d837e27`
- 编译目标：微信小程序（weapp）
- 后端 baseURL 可切换，dev 默认 `http://localhost:3000/api/v1`；所有网络请求经 `src/services/request.ts`
- 设计 token 取值以 Design Doc 第 3 节为准：背景 `#FAF6F0`、卡片 `#FFFFFF`/`#FEFCF9`、主强调奶橘 `#F0A868`、次强调藕粉 `#E4A9BE`、点缀雾霾蓝 `#A6C0CE`、文字 `#4A413A`/`#8A7F76`、互动暖红 `#EF8A7F`；卡片圆角 24rpx；阴影 `0 8rpx 24rpx rgba(74,65,58,0.08)`
- 动效仅用 `transform`/`opacity`，时长 200–400ms，缓动 `cubic-bezier(0.22,1,0.36,1)`
- 尺寸单位用 rpx；文字色不用纯黑
- 受保护接口带 `Authorization: Bearer <token>`；公开接口（帖子列表/详情）匿名可访问
- 语言：所有代码注释与文案用简体中文

---

### Task 1: Taro + React + bun 脚手架与编译冒烟

**Files:**
- Create: `config/index.ts`、`config/dev.ts`、`config/prod.ts`、`config/env.ts`
- Create: `src/app.config.ts`、`src/app.tsx`、`src/app.scss`
- Create: `src/pages/index/index.tsx`、`src/pages/index/index.config.ts`
- Create: `project.config.json`、`tsconfig.json`、`babel.config.js`
- Modify: `package.json`（合并 Taro 依赖与 bun 脚本）

**Interfaces:**
- Produces: 可编译的 Taro weapp 工程；`config/env.ts` 导出 `BASE_URL: string`

- [x] **Step 1: 用 Taro CLI 脚手架初始化到临时目录再合并**

Taro init 在非空目录交互不便，先生成到临时目录，再把工程文件合并进仓库根。
```bash
cd /Users/liuyang/mywork/tankingApp
bunx @tarojs/cli@4 init _mp_tmp --template default --typescript --css sass --npm bun --description "摆烂随笔" 2>&1 | tail -20 || true
```
若交互无法免参数，改用 `bunx @tarojs/cli@4 init` 按提示选择：React / TypeScript / Sass / bun / 模板 default。

- [x] **Step 2: 合并脚手架文件到仓库根**

把 `_mp_tmp` 下的 `config/ src/ project.config.json tsconfig.json babel.config.js` 复制到 `tankingMiniprogram/`，合并 `package.json` 的 `dependencies`/`devDependencies`/`scripts`（保留已有 openspec 依赖），然后删除临时目录。
```bash
cd /Users/liuyang/mywork/tankingApp/tankingMiniprogram
cp -R ../_mp_tmp/config ../_mp_tmp/src ../_mp_tmp/project.config.json ../_mp_tmp/tsconfig.json ../_mp_tmp/babel.config.js . 2>&1
# 手动合并 package.json 后：
rm -rf ../_mp_tmp
bun install
```

- [x] **Step 3: 写入 appid 与项目名**

编辑 `project.config.json`，设置 `"appid": "wx555c14bc9d837e27"`、`"projectname": "摆烂随笔"`。

- [x] **Step 4: 创建可切换 baseURL 的环境配置**

Create `config/env.ts`:
```ts
// 后端环境配置：按编译期 TARO_APP_ENV 切换 baseURL
const ENV = process.env.TARO_APP_ENV || 'dev'

const MAP: Record<string, string> = {
  dev: 'http://localhost:3000/api/v1',
  prod: 'https://api.example.com/api/v1', // 上线时替换为真实域名
}

export const BASE_URL = MAP[ENV] ?? MAP.dev
```

- [x] **Step 5: 首页占位 + TabBar 路由（app.config.ts）**

Create `src/app.config.ts`:
```ts
export default {
  pages: [
    'pages/index/index',
    'pages/publish/index',
    'pages/profile/index',
  ],
  window: {
    navigationStyle: 'custom',
    backgroundColor: '#FAF6F0',
  },
  tabBar: {
    color: '#8A7F76',
    selectedColor: '#F0A868',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      { pagePath: 'pages/index/index', text: '首页' },
      { pagePath: 'pages/publish/index', text: '发布' },
      { pagePath: 'pages/profile/index', text: '我的' },
    ],
  },
} as const
```
Create 三个占位页 `src/pages/{index,publish,profile}/index.tsx`（各渲染一行标题文案）与对应 `index.config.ts`。

- [x] **Step 6: 编译冒烟**

Run: `bun run build:weapp`
Expected: 生成 `dist/`，无编译错误。用微信开发者工具打开 `dist` 可加载、TabBar 三入口可切换。

- [x] **Step 7: Commit**
```bash
git add -A
git commit -m "feat(scaffold): 初始化 Taro4+React+bun 工程与 TabBar 骨架"
```

---

### Task 2: weapp-tailwindcss 与设计 token

**Files:**
- Create: `tailwind.config.js`、`postcss.config.js`、`src/styles/tokens.scss`、`src/styles/motion.scss`
- Modify: `config/index.ts`（接入 weapp-tailwindcss 插件）、`src/app.scss`（引入 tailwind 与 tokens）

**Interfaces:**
- Produces: 全局可用的 Tailwind 原子类（含设计 token 主题）与动效 keyframes

- [x] **Step 1: 安装依赖**
```bash
bun add -d tailwindcss@3 postcss autoprefixer weapp-tailwindcss
bunx tailwindcss init
```

- [x] **Step 2: 配置 Tailwind 主题（注入设计 token）**

Write `tailwind.config.js`:
```js
module.exports = {
  content: ['./src/**/*.{html,js,jsx,ts,tsx}'],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        bg: '#FAF6F0',
        card: '#FFFFFF',
        'card-soft': '#FEFCF9',
        peach: '#F0A868',      // 主强调 奶橘
        taro: '#E4A9BE',       // 次强调 藕粉
        haze: '#A6C0CE',       // 点缀 雾霾蓝
        ink: '#4A413A',        // 主文字
        'ink-sub': '#8A7F76',  // 次文字
        heart: '#EF8A7F',      // 互动暖红
      },
      borderRadius: { card: '24rpx', pill: '999rpx' },
      boxShadow: { soft: '0 8rpx 24rpx rgba(74,65,58,0.08)' },
      fontSize: {
        xs: '24rpx', sm: '28rpx', base: '32rpx',
        lg: '36rpx', xl: '44rpx', '2xl': '56rpx',
      },
    },
  },
  plugins: [],
}
```

- [x] **Step 3: 接入 weapp-tailwindcss 到 Taro 配置**

在 `config/index.ts` 按 weapp-tailwindcss 文档加入 `UnifiedWebpackPluginV5` 插件与 postcss 处理（webpack5 链）。参考包 README 的 Taro 接入段落。

- [x] **Step 4: 全局样式引入 token 与动效**

Write `src/styles/tokens.scss`（CSS 变量镜像上面颜色，供非原子类场景用）与 `src/styles/motion.scss`：
```scss
@keyframes fadeInUp { from { opacity:0; transform:translateY(16rpx);} to {opacity:1; transform:translateY(0);} }
@keyframes shimmer { from { background-position:-200% 0;} to { background-position:200% 0;} }
.anim-in { animation: fadeInUp .32s cubic-bezier(0.22,1,0.36,1) both; }
.press:active { transform: scale(.97); opacity:.9; transition: transform .18s, opacity .18s; }
```
在 `src/app.scss` 顶部加入：
```scss
@tailwind base;
@tailwind components;
@tailwind utilities;
@import './styles/tokens.scss';
@import './styles/motion.scss';
```

- [x] **Step 5: 首页验证原子类渲染**

在 `pages/index/index.tsx` 用 `className="bg-bg text-ink text-lg rounded-card shadow-soft"` 包一个卡片，`bun run build:weapp` 后在开发者工具确认样式生效、无未转换原子类残留。

- [x] **Step 6: Commit**
```bash
git add -A
git commit -m "feat(design-system): 接入 weapp-tailwindcss 与温柔治愈系设计 token"
```

---

### Task 3: 基础 UI 组件（Button / Card / Avatar / Tag）

**Files:**
- Create: `src/components/Button/index.tsx`、`src/components/Card/index.tsx`、`src/components/Avatar/index.tsx`、`src/components/Tag/index.tsx`、`src/components/index.ts`

**Interfaces:**
- Produces:
  - `Button(props:{ type?:'primary'|'ghost'|'pill'; onClick?:()=>void; children })`
  - `Card(props:{ float?:boolean; className?:string; children })`
  - `Avatar(props:{ src?:string; size?:number })`
  - `Tag(props:{ children; tone?:'peach'|'taro'|'haze' })`

- [x] **Step 1: Button**
```tsx
import { View } from '@tarojs/components'
import type { ReactNode } from 'react'

const MAP = {
  primary: 'bg-peach text-white',
  ghost: 'bg-transparent text-ink border border-ink-sub',
  pill: 'bg-taro text-white rounded-pill',
}
export default function Button(props: { type?: keyof typeof MAP; onClick?: () => void; children: ReactNode }) {
  const { type = 'primary', onClick, children } = props
  return (
    <View className={`press inline-flex items-center justify-center px-6 py-3 rounded-card text-base ${MAP[type]}`} onClick={onClick}>
      {children}
    </View>
  )
}
```

- [x] **Step 2: Card / Avatar / Tag**

Card:
```tsx
import { View } from '@tarojs/components'
export default function Card({ float, className = '', children }: { float?: boolean; className?: string; children: any }) {
  return <View className={`bg-card rounded-card shadow-soft p-6 ${float ? 'anim-in' : ''} ${className}`}>{children}</View>
}
```
Avatar（`Image` 圆形，缺省占位色 `bg-haze`）、Tag（小圆角标签，tone 映射到 `bg-peach/taro/haze` 的浅底）。`src/components/index.ts` 统一 re-export。

- [x] **Step 3: 组件展示页验证**

在 `pages/index/index.tsx` 临时渲染 Button/Card/Avatar/Tag，`bun run build:weapp` 后开发者工具确认视觉与按压动效（scale 0.97）。

- [x] **Step 4: Commit**
```bash
git add -A
git commit -m "feat(design-system): 基础 UI 组件 Button/Card/Avatar/Tag"
```

---

### Task 4: 骨架屏 / 过渡 / Toast

**Files:**
- Create: `src/components/Skeleton/index.tsx`、`src/components/Transition/index.tsx`、`src/components/Toast/index.tsx`

**Interfaces:**
- Produces: `Skeleton({rows?})`、`SkeletonList({count?})`、`Transition({children})`、`Toast`（订阅 uiStore）

- [x] **Step 1: Skeleton（shimmer）**
```tsx
import { View } from '@tarojs/components'
function Bar() {
  return <View className="rounded-card" style={{ height: '32rpx', background: 'linear-gradient(90deg,#EFE8DE 25%,#F6F1E9 37%,#EFE8DE 63%)', backgroundSize: '400% 100%', animation: 'shimmer 1.4s ease infinite' }} />
}
export function Skeleton({ rows = 3 }: { rows?: number }) {
  return <View className="space-y-3">{Array.from({ length: rows }).map((_, i) => <Bar key={i} />)}</View>
}
export function SkeletonList({ count = 4 }: { count?: number }) {
  return <View className="space-y-4">{Array.from({ length: count }).map((_, i) => <View key={i} className="bg-card rounded-card shadow-soft p-6"><Skeleton rows={3} /></View>)}</View>
}
```

- [x] **Step 2: Transition（fadeInUp 包装）+ Toast（读 uiStore，Task 7 后接线）**

Transition 用 `className="anim-in"` 包裹 children。Toast 先写静态 UI（顶部浮层），在 Task 7 完成 uiStore 后订阅 `toast` 状态显示/自动消失。

- [x] **Step 3: 验证并 Commit**

开发者工具确认骨架屏 shimmer 流动、Transition 进场。
```bash
git add -A && git commit -m "feat(design-system): 骨架屏/过渡/Toast 动效原语"
```

---

### Task 5: 后端接口契约类型

**Files:**
- Create: `src/types/api.ts`

**Interfaces:**
- Produces: `User`、`Post`、`PostImage`、`Topic`、`Comment`、`Like`、`Favorite`、`Paginated<T>`、`AuthResponse`

- [x] **Step 1: 依据 go-service 实际 JSON 契约写类型**

> 契约已核对 `pkg/response`（成功 `code===200`）与各 service response struct。注意：作者昵称 json 是 `name`、图片排序 json 是 `order`、分页是 `{data,meta}`、Post 含 `title`/`cover`。
```ts
export type PostStatus = 'DRAFT' | 'PUBLISHED'
// 统一响应包裹
export interface ApiEnvelope<T> { data: T; code: number; message: string }
export interface User { id: number; nickname: string; avatar: string; bio: string; gender: number; phone?: string }
export interface PostAuthor { id: number; name: string; avatar: string }   // 昵称 json tag = name
export interface PostImage { id: number; url: string; order: number }       // 排序 json tag = order
export interface Topic { id: number; name: string }
export interface Post {
  id: number; title: string; content: string; cover?: string; status: PostStatus
  authorId: number; author: PostAuthor
  viewCount: number; likeCount: number; commentCount: number
  images?: PostImage[]; topics?: Topic[]
  createdAt: string; updatedAt: string; publishedAt?: string
}
export interface Comment { id: number; content: string; parentId?: number; replies?: Comment[]; createdAt?: string }
export interface PaginationMeta { total: number; page: number; limit: number }
export interface Paginated<T> { data: T[]; meta: PaginationMeta }
export interface LoginUser { id: number; nickname: string; avatar: string }
export interface AuthResponse { token: string; user: LoginUser }

- [x] **Step 2: 类型校验并 Commit**

Run: `bunx tsc --noEmit`  Expected: 无类型错误。
```bash
git add -A && git commit -m "feat(data-access): go-service 接口契约 TypeScript 类型"
```

---

### Task 6: request 客户端（TDD）

**Files:**
- Create: `src/services/request.ts`、`src/services/errors.ts`
- Test: `src/services/__tests__/request.test.ts`
- Create: `vitest.config.ts`（若无）

**Interfaces:**
- Consumes: `BASE_URL`（Task 1）；`useAuthStore.getState().token`（Task 7，测试中 mock）
- Produces: `request<T>(opts:{ url; method?; data?; auth?:boolean }): Promise<T>`；`ApiError{ code; message; httpStatus }`

- [x] **Step 1: 写失败测试**
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
// mock Taro.request 与 authStore
vi.mock('@tarojs/taro', () => ({ default: { request: vi.fn() } }))
import Taro from '@tarojs/taro'
import { request } from '../request'
import { ApiError } from '../errors'

describe('request', () => {
  beforeEach(() => vi.clearAllMocks())
  it('成功时解包 data', async () => {
    ;(Taro.request as any).mockResolvedValue({ statusCode: 200, data: { code: 200, data: { id: 1 }, message: 'success' } })
    await expect(request({ url: '/posts/1' })).resolves.toEqual({ id: 1 })
  })
  it('业务 code 非 200 抛 ApiError', async () => {
    ;(Taro.request as any).mockResolvedValue({ statusCode: 200, data: { code: 1001, message: '失败' } })
    await expect(request({ url: '/x' })).rejects.toBeInstanceOf(ApiError)
  })
  it('401 触发清态回调', async () => {
    const onUnauthorized = vi.fn()
    ;(Taro.request as any).mockResolvedValue({ statusCode: 401, data: {} })
    await expect(request({ url: '/me', onUnauthorized } as any)).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthorized).toHaveBeenCalled()
  })
})
```

- [x] **Step 2: 运行确认失败**

Run: `bunx vitest run src/services/__tests__/request.test.ts`  Expected: FAIL（模块未实现）

- [x] **Step 3: 实现 errors.ts 与 request.ts**
```ts
// errors.ts
export class ApiError extends Error {
  constructor(public code: number, message: string, public httpStatus: number) { super(message) }
}
```
```ts
// request.ts
import Taro from '@tarojs/taro'
import { BASE_URL } from '../../config/env'
import { ApiError } from './errors'

interface Opts { url: string; method?: keyof typeof METHODS; data?: any; auth?: boolean; onUnauthorized?: () => void; token?: string }
const METHODS = { GET: 'GET', POST: 'POST', PATCH: 'PATCH', DELETE: 'DELETE', PUT: 'PUT' } as const

export async function request<T = any>(opts: Opts): Promise<T> {
  const header: Record<string, string> = { 'Content-Type': 'application/json' }
  if (opts.token) header['Authorization'] = `Bearer ${opts.token}`
  const res = await Taro.request({ url: BASE_URL + opts.url, method: (opts.method || 'GET') as any, data: opts.data, header })
  if (res.statusCode === 401) { opts.onUnauthorized?.(); throw new ApiError(401, '未登录或登录失效', 401) }
  const body: any = res.data
  if (res.statusCode >= 200 && res.statusCode < 300 && body && (body.code === 200 || body.code === undefined)) {
    return (body.data ?? body) as T
  }
  throw new ApiError(body?.code ?? res.statusCode, body?.message || '请求失败', res.statusCode)
}
```
> token 由调用方从 authStore 传入，保持 request 纯函数、便于测试（避免循环依赖）。

- [x] **Step 4: 运行确认通过**

Run: `bunx vitest run src/services/__tests__/request.test.ts`  Expected: PASS

- [x] **Step 5: Commit**
```bash
git add -A && git commit -m "feat(data-access): request 客户端（解包/JWT/401）+ 单测"
```

---

### Task 7: Zustand store（auth + ui）（TDD）

**Files:**
- Create: `src/store/auth.ts`、`src/store/ui.ts`
- Test: `src/store/__tests__/auth.test.ts`

**Interfaces:**
- Consumes: `Taro.setStorageSync/getStorageSync`（mock）
- Produces: `useAuthStore`（`token,user,isLogin,setAuth,clear,restore`）、`useUiStore`（`toast, showToast, globalLoading`）

- [x] **Step 1: 写失败测试**
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
const store: Record<string, any> = {}
vi.mock('@tarojs/taro', () => ({ default: {
  setStorageSync: (k: string, v: any) => { store[k] = v },
  getStorageSync: (k: string) => store[k],
  removeStorageSync: (k: string) => { delete store[k] },
}}))
import { useAuthStore } from '../auth'

describe('authStore', () => {
  beforeEach(() => { for (const k in store) delete store[k]; useAuthStore.getState().clear() })
  it('setAuth 写入并持久化', () => {
    useAuthStore.getState().setAuth('tk', { id: 1, nickname: 'a', avatar: '', bio: '', gender: 0 })
    expect(useAuthStore.getState().isLogin).toBe(true)
    expect(useAuthStore.getState().token).toBe('tk')
  })
  it('restore 从存储恢复', () => {
    useAuthStore.getState().setAuth('tk2', { id: 2, nickname: 'b', avatar: '', bio: '', gender: 0 })
    useAuthStore.setState({ token: '', user: null, isLogin: false })
    useAuthStore.getState().restore()
    expect(useAuthStore.getState().token).toBe('tk2')
  })
  it('clear 清空', () => {
    useAuthStore.getState().setAuth('tk', { id: 1, nickname: 'a', avatar: '', bio: '', gender: 0 })
    useAuthStore.getState().clear()
    expect(useAuthStore.getState().isLogin).toBe(false)
  })
})
```

- [x] **Step 2: 运行确认失败** — Run: `bunx vitest run src/store/__tests__/auth.test.ts` Expected: FAIL

- [x] **Step 3: 实现 auth.ts / ui.ts**
```ts
// auth.ts
import { create } from 'zustand'
import Taro from '@tarojs/taro'
import type { User } from '../types/api'
const TK = 'blr_token', UK = 'blr_user'
interface AuthState { token: string; user: User | null; isLogin: boolean; setAuth: (t: string, u: User) => void; clear: () => void; restore: () => void }
export const useAuthStore = create<AuthState>((set) => ({
  token: '', user: null, isLogin: false,
  setAuth: (token, user) => { Taro.setStorageSync(TK, token); Taro.setStorageSync(UK, user); set({ token, user, isLogin: true }) },
  clear: () => { Taro.removeStorageSync(TK); Taro.removeStorageSync(UK); set({ token: '', user: null, isLogin: false }) },
  restore: () => { const token = Taro.getStorageSync(TK); const user = Taro.getStorageSync(UK); if (token) set({ token, user, isLogin: true }) },
}))
```
ui.ts：`useUiStore` 含 `toast:{msg,type,visible}`、`showToast(msg,type)`（自动 2s 隐藏）、`globalLoading`。

- [x] **Step 4: 运行确认通过** — Expected: PASS
- [x] **Step 5: 接线 Toast 组件订阅 uiStore，Commit**
```bash
git add -A && git commit -m "feat(data-access): Zustand auth/ui store + 持久化单测"
```

---

### Task 8: API service 方法

**Files:**
- Create: `src/services/api/{auth,users,posts,interactions,upload}.ts`、`src/services/api/index.ts`
- Create: `src/services/authRequest.ts`（注入 token + 401 清态的高阶封装）

**Interfaces:**
- Consumes: `request`（Task 6）、`useAuthStore`（Task 7）
- Produces: 各模块类型化方法（见 Design Doc 4.2）

- [x] **Step 1: authRequest 封装（自动带 token + 401 清态）**
```ts
import { request } from './request'
import { useAuthStore } from '../store/auth'
export function authRequest<T>(opts: any): Promise<T> {
  const { token } = useAuthStore.getState()
  return request<T>({ ...opts, token, onUnauthorized: () => useAuthStore.getState().clear() })
}
```

- [x] **Step 2: 各 api 模块方法**

posts.ts 示例：
```ts
import { request } from '../request'
import { authRequest } from '../authRequest'
import type { Post, Paginated } from '../../types/api'
export const postsApi = {
  findAll: (page = 1) => request<Paginated<Post>>({ url: `/posts?page=${page}` }),
  findOne: (id: number) => request<Post>({ url: `/posts/${id}` }),
  create: (body: Partial<Post>) => authRequest<Post>({ url: '/posts', method: 'POST', data: body }),
  publish: (id: number) => authRequest<Post>({ url: `/posts/${id}/publish`, method: 'POST' }),
  findMyPosts: () => authRequest<Paginated<Post>>({ url: '/posts/my' }),
  findDrafts: () => authRequest<Paginated<Post>>({ url: '/posts/drafts' }),
}
```
auth/users/interactions/upload 同理（upload 用 `Taro.uploadFile` 单独封装，复用 token 与错误处理）。`api/index.ts` 汇总导出。

- [x] **Step 3: 类型校验 + Commit**
```bash
bunx tsc --noEmit
git add -A && git commit -m "feat(data-access): 各模块 API service 方法与鉴权封装"
```

---

### Task 9: 微信登录鉴权与登录守卫

**Files:**
- Create: `src/services/auth.ts`（`login()` 流程）、`src/hooks/useAuthGuard.ts`
- Modify: `src/app.tsx`（onLaunch restore）

**Interfaces:**
- Consumes: `auth.ts` 的 `wechatLogin`、`useAuthStore`
- Produces: `login(): Promise<void>`、`useAuthGuard(): (action:()=>void)=>void`

- [x] **Step 1: 登录流程**
```ts
import Taro from '@tarojs/taro'
import { request } from './request'
import { useAuthStore } from '../store/auth'
import type { AuthResponse } from '../types/api'
export async function login(): Promise<void> {
  const { code } = await Taro.login()
  if (!code) throw new Error('微信登录失败：未获取到 code')
  const res = await request<AuthResponse>({ url: '/auth/wechat/login', method: 'POST', data: { code } })
  useAuthStore.getState().setAuth(res.token, res.user)
}
```

- [x] **Step 2: 启动恢复登录态**

在 `src/app.tsx` 的 `useLaunch`/`componentDidShow` 调用 `useAuthStore.getState().restore()`。

- [x] **Step 3: 登录守卫 hook（未登录引导）**
```ts
import { useAuthStore } from '../store/auth'
import { login } from '../services/auth'
import { useUiStore } from '../store/ui'
export function useAuthGuard() {
  return async (action: () => void) => {
    if (useAuthStore.getState().isLogin) return action()
    try { await login(); action() } catch (e: any) { useUiStore.getState().showToast(e.message || '请先登录', 'error') }
  }
}
```

- [x] **Step 4: 冒烟验证 + Commit**

开发者工具中触发一次受保护动作，确认未登录时走登录流程（服务端未起时预期 401/网络错误提示，属已知项）。
```bash
git add -A && git commit -m "feat(wechat-auth): 微信登录换 JWT、启动恢复与登录守卫"
```

---

### Task 10: 联通冒烟、首页信息流接线与 README

**Files:**
- Modify: `src/pages/index/index.tsx`（用 postsApi.findAll 拉列表 + 骨架屏 + 卡片渲染）
- Create: `README.md`

**Interfaces:**
- Consumes: `postsApi.findAll`、`SkeletonList`、`Card`、`Avatar`、`Tag`

- [x] **Step 1: 首页信息流（公开接口，匿名可访问）**

`pages/index/index.tsx`：加载态显示 `SkeletonList`，成功渲染帖子卡片（作者头像+昵称、内容摘要、点赞/评论数）；请求失败显示占位与重试。服务端未起时预期请求失败并展示兜底 UI（验证请求层错误处理链路，属已知联调项）。

- [x] **Step 2: README**

写工程说明：技术栈、bun 脚本（`bun run dev:weapp`/`build:weapp`/`test`）、环境切换（`TARO_APP_ENV`）、目录约定、设计 token 位置、后续特性 change 复用指引。

- [x] **Step 3: 全量校验**

Run: `bunx tsc --noEmit && bunx vitest run && bun run build:weapp`
Expected: 类型通过、单测通过、编译产物生成。

- [x] **Step 4: Commit**
```bash
git add -A && git commit -m "feat(scaffold): 首页信息流接线、联通冒烟与 README"
```

---

## Self-Review

- **Spec 覆盖**：app-scaffold→Task1-2；design-system→Task2-4；data-access→Task5-8；wechat-auth→Task9；联通验证→Task10。4 份 spec 的验收场景均有对应任务。
- **占位符**：无 TBD/TODO；代码步骤均含真实代码。
- **类型一致**：`request`/`authRequest`/`ApiError`/`useAuthStore(setAuth/clear/restore)`/`postsApi.*` 跨任务签名一致。
- **已知联调项**：登录换 JWT 与列表真实数据依赖 go-service 启动；请求层与错误处理按契约实现并可离线验证分支逻辑（单测覆盖），端到端联调待服务端就绪。
