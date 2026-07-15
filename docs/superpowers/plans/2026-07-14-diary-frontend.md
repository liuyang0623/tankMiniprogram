---
change: diary-frontend
design-doc: docs/superpowers/specs/2026-07-14-diary-frontend-design.md
base-ref: 79bd876471713025b5e7f99e007a2a7a95c52a0b
---

# 日记前端（Moo 风格）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 移植 Moo 日记体验第一期——日记本 + 大图手帐卡横滑 + 富文本编辑 + 心情天气，跨后端 A2 与前端 B 两阶段。

**Architecture:** 后端 go-service 补 notebook 能力（表 + CRUD + diary.notebook_id + 默认本），前端 Taro 小程序消费接口，四 tab 加「日记」，列表页自定义 header 抽屉切日记本 + Swiper 大图卡横滑翻单篇。

**Tech Stack:** 后端 Go + Gin + GORM；前端 Taro 4 + React + TypeScript + weapp；测试 vitest（前端纯逻辑）+ go test（后端）。

## Global Constraints

- 后端仓库：`/Users/liuyang/mywork/tankingApp/go-service`；前端仓库：`/Users/liuyang/mywork/tankingApp/tankingMiniprogram`
- 所有产物、注释、commit message 用简体中文（Language: zh-CN）
- 后端响应统一 `{data, code, message}`，成功 `code===200`；分页 `{data, meta}`
- notebook 私密：所有接口 JWTMiddleware + service 层 `author_id == currentUser` 归属校验，越权返回 404
- 前端受保护请求用 `authRequest`；分页列表用 `usePagedList`；富文本用 `RichEditor`；图片用 `uploadApi`
- 主题 token：奶橘 `--c-peach #f0a868`、背景 `--c-bg #faf6f0`、墨 `--c-ink #4a413a`、次文 `--c-ink-sub #8a7f76`
- tabBar 图标只支持本地 PNG，用 `scripts/gen-tabbar-icons.mjs` 模式（iconfont svg → ImageMagick 81×81，灰 #8A7F76 / 奶橘 #F0A868）
- 提交节奏：每个 Task 完成即 commit，不积攒

---

## 阶段一：后端 A2（go-service 仓库 · openspec change `diary-notebook`）

> 注意：后端在独立仓库，走该仓库自己的 openspec 流程（裸 openspec，无 comet）。先建 change 产物，再实现。

### Task 1: 创建后端 openspec change `diary-notebook`

**Files:**
- Create: `openspec/changes/diary-notebook/proposal.md`
- Create: `openspec/changes/diary-notebook/design.md`
- Create: `openspec/changes/diary-notebook/tasks.md`
- Create: `openspec/changes/diary-notebook/specs/diary-notebook/spec.md`
- Modify: `openspec/changes/diary-notebook/.openspec.yaml`（proposal/design/specs 字段）

**Interfaces:**
- Produces: change 骨架，供后续任务填充

- [ ] **Step 1: 建 change**

工作目录 `/Users/liuyang/mywork/tankingApp/go-service`：
```bash
openspec new change "diary-notebook"
```
Expected: `Created change 'diary-notebook'`

- [ ] **Step 2: 写 proposal.md**

内容要点：Why（第一期日记本能力，diary 需归属 notebook）；What（notebook 表 + CRUD + diary.notebook_id + GET /diaries?notebookId= 过滤 + 首次访问自动建默认本）；Capabilities.New = `diary-notebook`；Impact（新增 internal/notebook/，改 internal/diary/ 加 notebook_id，改 main.go 路由 + migrate）。

- [ ] **Step 3: 写 design.md**

要点：Notebook 模型（gorm.Model + Name/Color/Cover/AuthorID）；NotebookService（Create/FindMine/Update/Remove + EnsureDefault）；diary 加 NotebookID 字段 + FindMine 支持 notebookId 过滤；路由 `/notebooks` 全 CRUD（JWT）；默认本策略：`GET /notebooks` 时若用户无任何本，自动建"默认"本再返回。

- [ ] **Step 4: 写 tasks.md + spec.md + .openspec.yaml**

tasks.md 覆盖：notebook model/service/handler、diary 加字段、路由注册、测试。spec.md 用 `## ADDED Requirements` + Scenario 格式（参照 internal/diary 的 spec）。.openspec.yaml 补 `proposal/design/specs` 字段。

- [ ] **Step 5: 提交**

```bash
cd /Users/liuyang/mywork/tankingApp/go-service
git checkout -b feature/diary-notebook
git add openspec/changes/diary-notebook/
git commit -m "docs(diary-notebook): openspec 产物（proposal/design/tasks/spec）"
```

### Task 2: Notebook 模型 + service

**Files:**
- Create: `/Users/liuyang/mywork/tankingApp/go-service/internal/notebook/model.go`
- Create: `/Users/liuyang/mywork/tankingApp/go-service/internal/notebook/service.go`
- Test: `/Users/liuyang/mywork/tankingApp/go-service/internal/notebook/service_test.go`

**Interfaces:**
- Produces:
  - `Notebook{gorm.Model; Name string; Color string; Cover string; AuthorID uint}`，TableName `notebooks`
  - `NotebookResponse{ID uint; Name string; Color string; Cover string; DiaryCount int64; CreatedAt time.Time}`
  - `CreateNotebookInput{Name,Color,Cover string}`、`UpdateNotebookInput{Name,Color,Cover *string}`
  - `NotebookService` 方法：`Create(ctx, userID, input) (*NotebookResponse, error)`、`FindMine(ctx, userID) ([]NotebookResponse, error)`、`Update(ctx, id, userID, input) (*NotebookResponse, error)`、`Remove(ctx, id, userID) error`、`EnsureDefault(ctx, userID) error`
  - 默认本常量 `DefaultNotebookName = "默认"`

- [ ] **Step 1: 写 model.go**

```go
package notebook

import (
	"time"

	"gorm.io/gorm"
)

// DefaultNotebookName 是新用户自动创建的默认日记本名称。
const DefaultNotebookName = "默认"

// Notebook 日记本，私密（仅本人）。
type Notebook struct {
	gorm.Model
	Name     string `gorm:"type:varchar(50)"`
	Color    string `gorm:"type:varchar(20)"` // 封面/兜底色，如 #f0a868
	Cover    string // 日记本封面图 URL（可选）
	AuthorID uint   `gorm:"index"`
}

// TableName 返回表名。
func (Notebook) TableName() string { return "notebooks" }

// NotebookResponse 是日记本 API 响应。
type NotebookResponse struct {
	ID         uint      `json:"id"`
	Name       string    `json:"name"`
	Color      string    `json:"color"`
	Cover      string    `json:"cover,omitempty"`
	DiaryCount int64     `json:"diaryCount"`
	CreatedAt  time.Time `json:"createdAt"`
}

// CreateNotebookInput 创建入参。
type CreateNotebookInput struct {
	Name  string `json:"name"`
	Color string `json:"color"`
	Cover string `json:"cover"`
}

// UpdateNotebookInput 更新入参（可选字段）。
type UpdateNotebookInput struct {
	Name  *string `json:"name,omitempty"`
	Color *string `json:"color,omitempty"`
	Cover *string `json:"cover,omitempty"`
}
```

- [ ] **Step 2: 写 service.go**

```go
package notebook

import (
	"context"
	"fmt"

	"gorm.io/gorm"
)

// NotebookService 处理日记本业务逻辑。
type NotebookService struct {
	db *gorm.DB
}

// NewNotebookService 构造。
func NewNotebookService(db *gorm.DB) *NotebookService {
	return &NotebookService{db: db}
}

// EnsureDefault 若用户无任何日记本，自动建一个"默认"本。
func (s *NotebookService) EnsureDefault(ctx context.Context, userID uint) error {
	var count int64
	if err := s.db.Model(&Notebook{}).Where("author_id = ?", userID).Count(&count).Error; err != nil {
		return fmt.Errorf("count notebooks: %w", err)
	}
	if count > 0 {
		return nil
	}
	nb := &Notebook{Name: DefaultNotebookName, Color: "#f0a868", AuthorID: userID}
	if err := s.db.Create(nb).Error; err != nil {
		return fmt.Errorf("create default notebook: %w", err)
	}
	return nil
}

// FindMine 返回当前用户全部日记本（含日记数），created_at ASC（默认本在前）。
func (s *NotebookService) FindMine(ctx context.Context, userID uint) ([]NotebookResponse, error) {
	if err := s.EnsureDefault(ctx, userID); err != nil {
		return nil, err
	}
	var nbs []Notebook
	if err := s.db.Where("author_id = ?", userID).Order("created_at ASC").Find(&nbs).Error; err != nil {
		return nil, fmt.Errorf("find notebooks: %w", err)
	}
	out := make([]NotebookResponse, len(nbs))
	for i, nb := range nbs {
		var cnt int64
		s.db.Table("diaries").Where("notebook_id = ? AND deleted_at IS NULL", nb.ID).Count(&cnt)
		out[i] = NotebookResponse{ID: nb.ID, Name: nb.Name, Color: nb.Color, Cover: nb.Cover, DiaryCount: cnt, CreatedAt: nb.CreatedAt}
	}
	return out, nil
}

// Create 创建日记本。
func (s *NotebookService) Create(ctx context.Context, userID uint, input CreateNotebookInput) (*NotebookResponse, error) {
	if input.Name == "" {
		return nil, fmt.Errorf("name is required")
	}
	color := input.Color
	if color == "" {
		color = "#f0a868"
	}
	nb := &Notebook{Name: input.Name, Color: color, Cover: input.Cover, AuthorID: userID}
	if err := s.db.Create(nb).Error; err != nil {
		return nil, fmt.Errorf("create notebook: %w", err)
	}
	return &NotebookResponse{ID: nb.ID, Name: nb.Name, Color: nb.Color, Cover: nb.Cover, DiaryCount: 0, CreatedAt: nb.CreatedAt}, nil
}

// Update 更新日记本（仅本人）。
func (s *NotebookService) Update(ctx context.Context, id, userID uint, input UpdateNotebookInput) (*NotebookResponse, error) {
	var nb Notebook
	if err := s.db.Where("author_id = ?", userID).First(&nb, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, fmt.Errorf("find notebook: %w", err)
	}
	updates := map[string]interface{}{}
	if input.Name != nil {
		updates["name"] = *input.Name
	}
	if input.Color != nil {
		updates["color"] = *input.Color
	}
	if input.Cover != nil {
		updates["cover"] = *input.Cover
	}
	if len(updates) > 0 {
		if err := s.db.Model(&nb).Updates(updates).Error; err != nil {
			return nil, fmt.Errorf("update notebook: %w", err)
		}
	}
	var cnt int64
	s.db.Table("diaries").Where("notebook_id = ? AND deleted_at IS NULL", nb.ID).Count(&cnt)
	return &NotebookResponse{ID: nb.ID, Name: nb.Name, Color: nb.Color, Cover: nb.Cover, DiaryCount: cnt, CreatedAt: nb.CreatedAt}, nil
}

// Remove 删除日记本（仅本人）。关联日记的 notebook_id 置 0（不级联删日记）。
func (s *NotebookService) Remove(ctx context.Context, id, userID uint) error {
	var nb Notebook
	if err := s.db.Where("author_id = ?", userID).First(&nb, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return gorm.ErrRecordNotFound
		}
		return fmt.Errorf("find notebook: %w", err)
	}
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Table("diaries").Where("notebook_id = ?", id).Update("notebook_id", 0).Error; err != nil {
			return err
		}
		return tx.Delete(&Notebook{}, id).Error
	})
}
```

- [ ] **Step 2b: 写 service_test.go**

参照 `internal/diary/service_test.go` 风格（若为纯常量/输入测试）。此处至少测 `DefaultNotebookName == "默认"` 与 `CreateNotebookInput` 零值：
```go
package notebook

import "testing"

func TestDefaultNotebookName(t *testing.T) {
	if DefaultNotebookName != "默认" {
		t.Errorf("expected 默认, got %s", DefaultNotebookName)
	}
}

func TestCreateNotebookInput_Defaults(t *testing.T) {
	in := CreateNotebookInput{}
	if in.Name != "" || in.Color != "" {
		t.Errorf("expected empty defaults")
	}
}
```

- [ ] **Step 3: 编译 + 测试**

```bash
cd /Users/liuyang/mywork/tankingApp/go-service && go build ./... && go test ./internal/notebook/...
```
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add internal/notebook/
git commit -m "feat(diary-notebook): notebook 模型 + service（CRUD + 默认本）"
```

### Task 3: Notebook handler + 路由注册 + migrate

**Files:**
- Create: `/Users/liuyang/mywork/tankingApp/go-service/internal/notebook/handler.go`
- Test: `/Users/liuyang/mywork/tankingApp/go-service/internal/notebook/handler_test.go`
- Modify: `/Users/liuyang/mywork/tankingApp/go-service/cmd/server/main.go`

**Interfaces:**
- Consumes: `NotebookService`（Task 2）
- Produces: 路由 `POST/GET /notebooks`、`PATCH/DELETE /notebooks/:id`（均 JWT）；`NewNotebookHandler(*NotebookService)`

- [ ] **Step 1: 写 handler.go**

照搬 `internal/diary/handler.go` 结构（`getUserID`、response 包、归属 404 映射）。方法：`Create`、`FindMine`、`Update`、`Remove`。接口 `notebookServiceIface` 抽象 4 方法便于测试。

```go
package notebook

import (
	"context"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"go-service/pkg/response"
)

type notebookServiceIface interface {
	Create(ctx context.Context, userID uint, input CreateNotebookInput) (*NotebookResponse, error)
	FindMine(ctx context.Context, userID uint) ([]NotebookResponse, error)
	Update(ctx context.Context, id, userID uint, input UpdateNotebookInput) (*NotebookResponse, error)
	Remove(ctx context.Context, id, userID uint) error
}

type NotebookHandler struct {
	service notebookServiceIface
}

func NewNotebookHandler(service *NotebookService) *NotebookHandler {
	return &NotebookHandler{service: service}
}

func getUserID(c *gin.Context) (uint, bool) {
	val, ok := c.Get("userID")
	if !ok {
		return 0, false
	}
	uid, ok := val.(uint)
	return uid, ok
}

func (h *NotebookHandler) Create(c *gin.Context) {
	uid, ok := getUserID(c)
	if !ok {
		response.Unauthorized(c, "unauthorized")
		return
	}
	var input CreateNotebookInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if input.Name == "" {
		response.BadRequest(c, "name is required")
		return
	}
	nb, err := h.service.Create(c.Request.Context(), uid, input)
	if err != nil {
		response.InternalError(c, "server error")
		return
	}
	response.Success(c, nb)
}

func (h *NotebookHandler) FindMine(c *gin.Context) {
	uid, ok := getUserID(c)
	if !ok {
		response.Unauthorized(c, "unauthorized")
		return
	}
	list, err := h.service.FindMine(c.Request.Context(), uid)
	if err != nil {
		response.InternalError(c, "server error")
		return
	}
	response.Success(c, list)
}

func (h *NotebookHandler) Update(c *gin.Context) {
	uid, ok := getUserID(c)
	if !ok {
		response.Unauthorized(c, "unauthorized")
		return
	}
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid notebook id")
		return
	}
	var input UpdateNotebookInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	nb, err := h.service.Update(c.Request.Context(), uint(id), uid, input)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			response.Error(c, http.StatusNotFound, "notebook not found")
			return
		}
		response.InternalError(c, "server error")
		return
	}
	response.Success(c, nb)
}

func (h *NotebookHandler) Remove(c *gin.Context) {
	uid, ok := getUserID(c)
	if !ok {
		response.Unauthorized(c, "unauthorized")
		return
	}
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid notebook id")
		return
	}
	if err := h.service.Remove(c.Request.Context(), uint(id), uid); err != nil {
		if err == gorm.ErrRecordNotFound {
			response.Error(c, http.StatusNotFound, "notebook not found")
			return
		}
		response.InternalError(c, "server error")
		return
	}
	response.Success(c, gin.H{"message": "deleted"})
}
```

- [ ] **Step 2: 写 handler_test.go**

照搬 `internal/diary/handler_test.go` 的 mock + gin.TestMode 模式，测：Create 成功、Create 空 name 400、FindMine 成功、Update 404、Remove 成功、未授权 401。

- [ ] **Step 3: 注册路由 + migrate（main.go）**

在 diary 路由后插入：
```go
// Notebook routes (require JWT — all private)
notebookSvc := notebook.NewNotebookService(db)
notebookHandler := notebook.NewNotebookHandler(notebookSvc)
authorized.POST("/notebooks", notebookHandler.Create)
authorized.GET("/notebooks", notebookHandler.FindMine)
authorized.PATCH("/notebooks/:id", notebookHandler.Update)
authorized.DELETE("/notebooks/:id", notebookHandler.Remove)
```
import 加 `"go-service/internal/notebook"`。AutoMigrate 加 `&notebook.Notebook{}`。

- [ ] **Step 4: 编译 + 测试 + 提交**

```bash
cd /Users/liuyang/mywork/tankingApp/go-service && go build ./... && go test ./...
git add internal/notebook/ cmd/server/main.go
git commit -m "feat(diary-notebook): notebook handler + 路由 + migrate"
```

### Task 4: diary 加 notebook_id + 过滤

**Files:**
- Modify: `/Users/liuyang/mywork/tankingApp/go-service/internal/diary/model.go`
- Modify: `/Users/liuyang/mywork/tankingApp/go-service/internal/diary/service.go`
- Modify: `/Users/liuyang/mywork/tankingApp/go-service/internal/diary/handler.go`

**Interfaces:**
- Consumes: notebook 表已存在（Task 2-3）
- Produces: `Diary.NotebookID uint`；`FindMine` 支持 `notebookId` 过滤；create/update 接受 `notebookId`；响应含 `notebookId`

- [ ] **Step 1: model.go 加字段**

`Diary` struct 加 `NotebookID uint \`gorm:"index"\``。`DiaryResponse`、`DiaryListItem` 加 `NotebookID uint \`json:"notebookId"\``。`CreateDiaryInput` 加 `NotebookID uint \`json:"notebookId"\``。`UpdateDiaryInput` 加 `NotebookID *uint \`json:"notebookId,omitempty"\``。

- [ ] **Step 2: service.go 支持过滤 + 落字段**

`Create`：`Diary{..., NotebookID: input.NotebookID}`。`FindMine` 增加可选 `notebookID uint` 参数（0=不过滤）：`if notebookID > 0 { q = q.Where("notebook_id = ?", notebookID) }`。`toDiaryResponse`/`toListItem` 填 `NotebookID`。`dbDiary` 复制 `NotebookID`。`Update`：`if input.NotebookID != nil { updates["notebook_id"] = *input.NotebookID }`。

- [ ] **Step 3: handler.go 读 query**

`FindMine` handler 读 `c.Query("notebookId")` → 解析 uint（失败=0）→ 传入 service。

- [ ] **Step 4: 编译 + 测试 + 提交**

```bash
cd /Users/liuyang/mywork/tankingApp/go-service && go build ./... && go test ./...
git add internal/diary/
git commit -m "feat(diary-notebook): diary 加 notebook_id + 按日记本过滤"
```

### Task 5: 后端 A2 归档 + 合并

- [ ] **Step 1: 勾选 tasks.md 全部项**
- [ ] **Step 2: 归档**

```bash
cd /Users/liuyang/mywork/tankingApp/go-service
git add openspec/changes/diary-notebook/
git commit -m "chore(diary-notebook): 勾选任务完成"
openspec archive diary-notebook --yes
git add .
git commit -m "chore(diary-notebook): openspec 归档"
```

- [ ] **Step 3: 合并回 main**

```bash
git checkout main
git merge --no-ff feature/diary-notebook -m "Merge feature/diary-notebook: 日记本能力（notebook CRUD + diary 归属）"
git branch -d feature/diary-notebook
```

---

## 阶段二：前端 B（tankingMiniprogram 仓库）

> 全部在 `/Users/liuyang/mywork/tankingApp/tankingMiniprogram`。已在 comet build 阶段的 feature 分支上（Task 6 前由 comet-build 建分支）。

### Task 6: 类型定义 types/diary.ts

**Files:**
- Create: `src/types/diary.ts`

**Interfaces:**
- Produces: `Notebook`、`Diary`、`DiaryListItem`、`CreateDiaryBody`、`UpdateDiaryBody`、`CreateNotebookBody`、`UpdateNotebookBody`、`MOODS`、`WEATHERS`、`moodEmoji(key)`、`weatherEmoji(key)`

- [ ] **Step 1: 写 types/diary.ts**

```ts
import type { Paginated } from './api'

export interface Notebook {
  id: number
  name: string
  color: string
  cover?: string
  diaryCount: number
  createdAt: string
}

export interface Diary {
  id: number
  notebookId: number
  title: string
  content: string
  cover: string
  mood: string
  weather: string
  images?: { id: number; url: string; order: number }[]
  createdAt: string
  updatedAt: string
}

export interface DiaryListItem {
  id: number
  notebookId: number
  title: string
  contentPreview: string
  cover: string
  mood: string
  weather: string
  createdAt: string
}

export type PaginatedDiaries = Paginated<DiaryListItem>

export interface CreateDiaryBody {
  notebookId: number
  title: string
  content: string
  cover?: string
  mood?: string
  weather?: string
  images?: string[]
}
export type UpdateDiaryBody = Partial<CreateDiaryBody>

export interface CreateNotebookBody {
  name: string
  color: string
  cover?: string
}
export type UpdateNotebookBody = Partial<CreateNotebookBody>

export interface MoodOption {
  key: string
  emoji: string
  label: string
}

export const MOODS: MoodOption[] = [
  { key: 'happy', emoji: '😊', label: '开心' },
  { key: 'calm', emoji: '😐', label: '平静' },
  { key: 'sad', emoji: '😢', label: '难过' },
  { key: 'tired', emoji: '😴', label: '疲惫' },
  { key: 'love', emoji: '🥰', label: '幸福' },
]

export const WEATHERS: MoodOption[] = [
  { key: 'sunny', emoji: '☀️', label: '晴' },
  { key: 'cloudy', emoji: '⛅', label: '多云' },
  { key: 'rainy', emoji: '🌧', label: '雨' },
  { key: 'snowy', emoji: '❄️', label: '雪' },
  { key: 'rainbow', emoji: '🌈', label: '彩虹' },
]

/** 心情 key → emoji，未知返回空串 */
export function moodEmoji(key: string): string {
  return MOODS.find((m) => m.key === key)?.emoji ?? ''
}

/** 天气 key → emoji，未知返回空串 */
export function weatherEmoji(key: string): string {
  return WEATHERS.find((w) => w.key === key)?.emoji ?? ''
}
```

- [ ] **Step 2: 单测 src/types/__tests__/diary.test.ts**

```ts
import { describe, it, expect } from 'vitest'
import { moodEmoji, weatherEmoji, MOODS, WEATHERS } from '../diary'

describe('diary 心情天气映射', () => {
  it('moodEmoji 命中', () => { expect(moodEmoji('happy')).toBe('😊') })
  it('moodEmoji 未知返回空', () => { expect(moodEmoji('xxx')).toBe('') })
  it('weatherEmoji 命中', () => { expect(weatherEmoji('sunny')).toBe('☀️') })
  it('weatherEmoji 未知返回空', () => { expect(weatherEmoji('')).toBe('') })
  it('选项集非空', () => { expect(MOODS.length).toBe(5); expect(WEATHERS.length).toBe(5) })
})
```

- [ ] **Step 3: 跑测试**

```bash
cd /Users/liuyang/mywork/tankingApp/tankingMiniprogram && npx vitest run src/types/__tests__/diary.test.ts
```
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add src/types/diary.ts src/types/__tests__/diary.test.ts
git commit -m "feat(diary-frontend): 日记类型定义 + 心情天气常量"
```

### Task 7: API 服务 services/api/diary.ts

**Files:**
- Create: `src/services/api/diary.ts`
- Modify: `src/services/api/index.ts`

**Interfaces:**
- Consumes: `authRequest`、类型（Task 6）
- Produces: `diaryApi{list,detail,create,update,remove}`、`notebookApi{list,create,update,remove}`

- [ ] **Step 1: 写 diary.ts**

```ts
import { authRequest } from '../authRequest'
import type {
  Diary, PaginatedDiaries, CreateDiaryBody, UpdateDiaryBody,
  Notebook, CreateNotebookBody, UpdateNotebookBody,
} from '../../types/diary'

export const notebookApi = {
  /** 我的日记本列表（后端自动建默认本） */
  list: () => authRequest<Notebook[]>({ url: '/notebooks' }),
  /** 新建日记本 */
  create: (body: CreateNotebookBody) => authRequest<Notebook>({ url: '/notebooks', method: 'POST', data: body }),
  /** 改日记本 */
  update: (id: number, body: UpdateNotebookBody) =>
    authRequest<Notebook>({ url: `/notebooks/${id}`, method: 'PATCH', data: body }),
  /** 删日记本 */
  remove: (id: number) => authRequest<void>({ url: `/notebooks/${id}`, method: 'DELETE' }),
}

export const diaryApi = {
  /** 某日记本的日记列表（分页时间线） */
  list: (p: { notebookId: number; page?: number }) =>
    authRequest<PaginatedDiaries>({ url: `/diaries?notebookId=${p.notebookId}&page=${p.page ?? 1}` }),
  /** 日记详情 */
  detail: (id: number) => authRequest<Diary>({ url: `/diaries/${id}` }),
  /** 新建日记 */
  create: (body: CreateDiaryBody) => authRequest<Diary>({ url: '/diaries', method: 'POST', data: body }),
  /** 改日记 */
  update: (id: number, body: UpdateDiaryBody) =>
    authRequest<Diary>({ url: `/diaries/${id}`, method: 'PATCH', data: body }),
  /** 删日记 */
  remove: (id: number) => authRequest<void>({ url: `/diaries/${id}`, method: 'DELETE' }),
}
```

- [ ] **Step 2: index.ts 导出**

追加：`export { diaryApi, notebookApi } from './diary'`

- [ ] **Step 3: tsc + 提交**

```bash
cd /Users/liuyang/mywork/tankingApp/tankingMiniprogram && npx tsc --noEmit
git add src/services/api/diary.ts src/services/api/index.ts
git commit -m "feat(diary-frontend): 日记/日记本 API 服务"
```

### Task 8: tabBar 四 tab + 日记图标 + 页面注册

**Files:**
- Modify: `scripts/gen-tabbar-icons.mjs`
- Create: `src/assets/tabbar/diary.png`、`src/assets/tabbar/diary-active.png`（脚本生成）
- Modify: `src/app.config.ts`

**Interfaces:**
- Produces: tabBar 四 tab（首页/日记/消息/我的）、日记三页注册

- [ ] **Step 1: 确认 iconfont 有日记图标**

```bash
cd /Users/liuyang/mywork/tankingApp/tankingMiniprogram
grep -oE '"[a-z_]+":' src/components/Iconfont/icons.ts | head -30
```
从中挑一个像"日记本/笔记本"的 name（如 `riji`/`bijiben`/`benzi`）。若无合适的，用户需先在 iconfont 加图标并跑 `node scripts/gen-icons.mjs`。**若确无日记图标，本步骤暂用 `bianji`（编辑）占位并在 commit 注明待替换。**

- [ ] **Step 2: gen-tabbar-icons.mjs 加日记条目**

`TABBAR_ICONS` 数组加 `{ icon: '<日记图标名>', out: 'diary' }`。

- [ ] **Step 3: 生成图标**

```bash
node scripts/gen-tabbar-icons.mjs
ls src/assets/tabbar/diary*.png
```
Expected: `diary.png`、`diary-active.png` 生成

- [ ] **Step 4: app.config.ts 四 tab + 页面**

`pages` 数组加 `'pages/diary/index'`、`'pages/diary/edit'`、`'pages/diary/detail'`。`tabBar.list` 在首页后、消息前插入：
```ts
{
  pagePath: 'pages/diary/index',
  text: '日记',
  iconPath: 'assets/tabbar/diary.png',
  selectedIconPath: 'assets/tabbar/diary-active.png',
},
```
最终顺序：首页 / 日记 / 消息 / 我的。

- [ ] **Step 5: 提交**

```bash
git add scripts/gen-tabbar-icons.mjs src/assets/tabbar/diary.png src/assets/tabbar/diary-active.png src/app.config.ts
git commit -m "feat(diary-frontend): tabBar 加日记 tab（四 tab）+ 图标"
```

### Task 9: MoodWeatherPicker 组件

**Files:**
- Create: `src/components/MoodWeatherPicker/index.tsx`
- Create: `src/components/MoodWeatherPicker/index.scss`
- Modify: `src/components/index.ts`

**Interfaces:**
- Consumes: `MOODS`、`WEATHERS`（Task 6）
- Produces: `<MoodWeatherPicker mood weather onChange={(m,w)=>...} />`

- [ ] **Step 1: 写 index.tsx**

```tsx
import { View, Text } from '@tarojs/components'
import { MOODS, WEATHERS } from '../../types/diary'
import './index.scss'

interface Props {
  mood: string
  weather: string
  onChange: (mood: string, weather: string) => void
}

export default function MoodWeatherPicker({ mood, weather, onChange }: Props) {
  return (
    <View className='mw-picker'>
      <View className='mw-row'>
        <Text className='mw-label'>心情</Text>
        <View className='mw-opts'>
          {MOODS.map((m) => (
            <View
              key={m.key}
              className={`mw-opt ${mood === m.key ? 'mw-opt--active' : ''}`}
              onClick={() => onChange(m.key, weather)}
            >
              <Text className='mw-emoji'>{m.emoji}</Text>
            </View>
          ))}
        </View>
      </View>
      <View className='mw-row'>
        <Text className='mw-label'>天气</Text>
        <View className='mw-opts'>
          {WEATHERS.map((w) => (
            <View
              key={w.key}
              className={`mw-opt ${weather === w.key ? 'mw-opt--active' : ''}`}
              onClick={() => onChange(mood, w.key)}
            >
              <Text className='mw-emoji'>{w.emoji}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
```

- [ ] **Step 2: 写 index.scss**

```scss
.mw-picker { padding: 16px 0; }
.mw-row { display: flex; align-items: center; margin-bottom: 12px; }
.mw-label { width: 64px; color: var(--c-ink-sub); font-size: 28px; }
.mw-opts { display: flex; flex: 1; gap: 12px; }
.mw-opt {
  width: 64px; height: 64px; border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  background: var(--c-card-soft); border: 2px solid transparent;
}
.mw-opt--active { border-color: var(--c-peach); background: rgba(240, 168, 104, 0.12); }
.mw-emoji { font-size: 36px; }
```

- [ ] **Step 3: components/index.ts 导出**

追加：`export { default as MoodWeatherPicker } from './MoodWeatherPicker'`

- [ ] **Step 4: tsc + 提交**

```bash
npx tsc --noEmit
git add src/components/MoodWeatherPicker/ src/components/index.ts
git commit -m "feat(diary-frontend): MoodWeatherPicker 心情天气单选组件"
```

### Task 10: DiaryCard 大图手帐卡组件

**Files:**
- Create: `src/components/DiaryCard/index.tsx`
- Create: `src/components/DiaryCard/index.scss`
- Modify: `src/components/index.ts`

**Interfaces:**
- Consumes: `DiaryListItem`、`moodEmoji`、`weatherEmoji`、`formatRelativeTime`
- Produces: `<DiaryCard diary notebookColor onTap />`

- [ ] **Step 1: 写 index.tsx**

```tsx
import { View, Text } from '@tarojs/components'
import { moodEmoji, weatherEmoji } from '../../types/diary'
import { formatRelativeTime } from '../../utils/time'
import type { DiaryListItem } from '../../types/diary'
import './index.scss'

interface Props {
  diary: DiaryListItem
  notebookColor: string
  onTap: () => void
}

export default function DiaryCard({ diary, notebookColor, onTap }: Props) {
  const hasCover = !!diary.cover
  const bg = hasCover
    ? { backgroundImage: `url(${diary.cover})` }
    : { background: `linear-gradient(135deg, ${notebookColor}, ${notebookColor}cc)` }
  return (
    <View className='diary-card' onClick={onTap}>
      <View className={`diary-card__bg ${hasCover ? '' : 'diary-card__bg--solid'}`} style={bg}>
        <View className='diary-card__mask'>
          <View className='diary-card__meta'>
            {diary.mood ? <Text className='diary-card__emoji'>{moodEmoji(diary.mood)}</Text> : null}
            {diary.weather ? <Text className='diary-card__emoji'>{weatherEmoji(diary.weather)}</Text> : null}
            <Text className='diary-card__date'>{formatRelativeTime(diary.createdAt)}</Text>
          </View>
          <Text className='diary-card__title'>{diary.title || '无标题'}</Text>
        </View>
      </View>
    </View>
  )
}
```

- [ ] **Step 2: 写 index.scss**

```scss
.diary-card { width: 100%; height: 100%; padding: 24px; box-sizing: border-box; }
.diary-card__bg {
  width: 100%; height: 100%; border-radius: 28px; overflow: hidden;
  background-size: cover; background-position: center;
  display: flex; align-items: flex-end; box-shadow: 0 8px 24px var(--c-shadow);
}
.diary-card__mask {
  width: 100%; padding: 32px 28px;
  background: linear-gradient(to top, rgba(0,0,0,0.55), transparent);
}
.diary-card__meta { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.diary-card__emoji { font-size: 32px; }
.diary-card__date { color: rgba(255,255,255,0.85); font-size: 24px; }
.diary-card__title { color: #fff; font-size: 40px; font-weight: 600; display: block; }
.diary-card__bg--solid .diary-card__title { color: #fff; }
```

- [ ] **Step 3: components/index.ts 导出 + tsc + 提交**

```bash
npx tsc --noEmit
git add src/components/DiaryCard/ src/components/index.ts
git commit -m "feat(diary-frontend): DiaryCard 大图手帐卡组件"
```

### Task 11: NotebookDrawer 抽屉组件

**Files:**
- Create: `src/components/NotebookDrawer/index.tsx`
- Create: `src/components/NotebookDrawer/index.scss`
- Modify: `src/components/index.ts`

**Interfaces:**
- Consumes: `Notebook`
- Produces: `<NotebookDrawer open notebooks activeId onSelect onCreate onManage onClose />`

- [ ] **Step 1: 写 index.tsx**

```tsx
import { View, Text } from '@tarojs/components'
import type { Notebook } from '../../types/diary'
import './index.scss'

interface Props {
  open: boolean
  notebooks: Notebook[]
  activeId?: number
  onSelect: (id: number) => void
  onCreate: () => void
  onManage: () => void
  onClose: () => void
}

export default function NotebookDrawer({ open, notebooks, activeId, onSelect, onCreate, onManage, onClose }: Props) {
  if (!open) return null
  return (
    <View className='nb-drawer'>
      <View className='nb-drawer__mask' onClick={onClose} />
      <View className='nb-drawer__panel'>
        {notebooks.map((nb) => (
          <View
            key={nb.id}
            className={`nb-item ${activeId === nb.id ? 'nb-item--active' : ''}`}
            onClick={() => onSelect(nb.id)}
          >
            <View className='nb-item__dot' style={{ background: nb.color }} />
            <Text className='nb-item__name'>{nb.name}</Text>
            <Text className='nb-item__count'>{nb.diaryCount} 篇</Text>
            {activeId === nb.id ? <Text className='nb-item__check'>✓</Text> : null}
          </View>
        ))}
        <View className='nb-divider' />
        <View className='nb-action' onClick={onCreate}>
          <Text className='nb-action__text'>＋ 新建日记本</Text>
        </View>
        <View className='nb-action' onClick={onManage}>
          <Text className='nb-action__text'>⚙ 管理日记本</Text>
        </View>
      </View>
    </View>
  )
}
```

- [ ] **Step 2: 写 index.scss**

```scss
.nb-drawer { position: fixed; inset: 0; z-index: 100; }
.nb-drawer__mask { position: absolute; inset: 0; background: rgba(0,0,0,0.35); }
.nb-drawer__panel {
  position: absolute; top: 0; left: 0; right: 0;
  background: var(--c-card); border-radius: 0 0 28px 28px;
  padding: 24px; box-shadow: 0 8px 24px var(--c-shadow);
}
.nb-item { display: flex; align-items: center; padding: 20px 12px; border-radius: 16px; }
.nb-item--active { background: rgba(240, 168, 104, 0.1); }
.nb-item__dot { width: 20px; height: 20px; border-radius: 50%; margin-right: 16px; }
.nb-item__name { flex: 1; color: var(--c-ink); font-size: 30px; }
.nb-item__count { color: var(--c-ink-sub); font-size: 24px; margin-right: 12px; }
.nb-item__check { color: var(--c-peach); font-size: 30px; }
.nb-divider { height: 1px; background: var(--c-shadow); margin: 12px 0; }
.nb-action { padding: 18px 12px; }
.nb-action__text { color: var(--c-peach); font-size: 28px; }
```

- [ ] **Step 3: 导出 + tsc + 提交**

```bash
npx tsc --noEmit
git add src/components/NotebookDrawer/ src/components/index.ts
git commit -m "feat(diary-frontend): NotebookDrawer 日记本抽屉组件"
```

### Task 12: 日记列表页 pages/diary/index

**Files:**
- Create: `src/pages/diary/index.tsx`
- Create: `src/pages/diary/index.scss`
- Create: `src/pages/diary/index.config.ts`

**Interfaces:**
- Consumes: `notebookApi`、`diaryApi`、`NotebookDrawer`、`DiaryCard`、`PageLayout`
- Produces: 日记 tab 主页

- [ ] **Step 1: 写 index.config.ts**

```ts
export default definePageConfig({
  navigationStyle: 'custom',
})
```

- [ ] **Step 2: 写 index.tsx**

要点（数据流 follow-list 成熟模式，避免闭包坑）：
```tsx
import { useState, useCallback } from 'react'
import { View, Text, Swiper, SwiperItem } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { NotebookDrawer, DiaryCard, PageLayout } from '../../components'
import { notebookApi, diaryApi } from '../../services/api'
import { useAuthStore } from '../../store/auth'
import type { Notebook, DiaryListItem } from '../../types/diary'
import './index.scss'

export default function DiaryIndex() {
  const isLogin = useAuthStore((s) => s.isLogin)
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [activeNb, setActiveNb] = useState<number>()
  const [diaries, setDiaries] = useState<DiaryListItem[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)

  const loadDiaries = useCallback(async (nbId: number) => {
    const r = await diaryApi.list({ notebookId: nbId })
    setDiaries(r.data)
  }, [])

  const loadNotebooks = useCallback(async () => {
    if (!useAuthStore.getState().isLogin) return
    const nbs = await notebookApi.list()
    setNotebooks(nbs)
    const cur = useAuthStore.getState() // 保持当前选中，否则默认第一个
    const first = nbs[0]?.id
    setActiveNb((prev) => {
      const keep = prev && nbs.some((n) => n.id === prev) ? prev : first
      if (keep) loadDiaries(keep)
      return keep
    })
  }, [loadDiaries])

  useDidShow(() => { loadNotebooks() })

  const activeNotebook = notebooks.find((n) => n.id === activeNb)

  const onSelectNb = (id: number) => {
    setActiveNb(id)
    setDrawerOpen(false)
    loadDiaries(id)
  }

  const onCreateNb = async () => {
    const res = await Taro.showModal({ title: '新建日记本', editable: true, placeholderText: '日记本名称' })
    if (res.confirm && res.content) {
      const nb = await notebookApi.create({ name: res.content, color: '#f0a868' })
      setDrawerOpen(false)
      await loadNotebooks()
      onSelectNb(nb.id)
    }
  }

  const onManage = () => { setDrawerOpen(false); Taro.navigateTo({ url: '/pages/diary/detail?manage=1' }) } // 占位：管理入口（改名删除走 detail 或独立页，第一期用 showActionSheet）

  return (
    <PageLayout>
      <View className='diary-header' onClick={() => setDrawerOpen(true)}>
        <Text className='diary-header__name'>{activeNotebook?.name ?? '我的日记本'}</Text>
        <Text className='diary-header__arrow'>▼</Text>
      </View>

      <NotebookDrawer
        open={drawerOpen}
        notebooks={notebooks}
        activeId={activeNb}
        onSelect={onSelectNb}
        onCreate={onCreateNb}
        onManage={onManage}
        onClose={() => setDrawerOpen(false)}
      />

      {diaries.length === 0 ? (
        <View className='diary-empty'>
          <Text className='diary-empty__text'>这个本子还没有日记，写第一篇吧</Text>
        </View>
      ) : (
        <Swiper className='diary-swiper' circular={false} previousMargin='24px' nextMargin='24px'>
          {diaries.map((d) => (
            <SwiperItem key={d.id}>
              <DiaryCard
                diary={d}
                notebookColor={activeNotebook?.color ?? '#f0a868'}
                onTap={() => Taro.navigateTo({ url: `/pages/diary/detail?id=${d.id}` })}
              />
            </SwiperItem>
          ))}
        </Swiper>
      )}

      <View className='diary-fab' onClick={() => Taro.navigateTo({ url: `/pages/diary/edit?notebookId=${activeNb ?? ''}` })}>
        <Text className='diary-fab__plus'>＋</Text>
      </View>
    </PageLayout>
  )
}
```

> 说明：管理入口（onManage）第一期简化——点击弹 `Taro.showActionSheet` 选改名/删除当前日记本，调用 `notebookApi.update/remove`。实现时替换占位 navigateTo。

- [ ] **Step 3: 写 index.scss**

```scss
.diary-header {
  display: flex; align-items: center; justify-content: center;
  padding: 24px; gap: 8px;
}
.diary-header__name { color: var(--c-ink); font-size: 34px; font-weight: 600; }
.diary-header__arrow { color: var(--c-ink-sub); font-size: 24px; }
.diary-swiper { height: 60vh; }
.diary-empty { display: flex; align-items: center; justify-content: center; height: 60vh; }
.diary-empty__text { color: var(--c-ink-sub); font-size: 28px; }
.diary-fab {
  position: fixed; right: 40px; bottom: 60px;
  width: 100px; height: 100px; border-radius: 50%;
  background: var(--c-peach); display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 24px var(--c-shadow);
}
.diary-fab__plus { color: #fff; font-size: 56px; }
```

- [ ] **Step 4: 管理入口实现（替换占位）**

`onManage` 改为：
```tsx
const onManage = async () => {
  setDrawerOpen(false)
  if (!activeNotebook) return
  const res = await Taro.showActionSheet({ itemList: ['改名', '删除'] })
  if (res.tapIndex === 0) {
    const r = await Taro.showModal({ title: '改名', editable: true, content: activeNotebook.name })
    if (r.confirm && r.content) { await notebookApi.update(activeNotebook.id, { name: r.content }); loadNotebooks() }
  } else if (res.tapIndex === 1) {
    const r = await Taro.showModal({ title: '删除日记本', content: '删除后本内日记将移出该本，确认？' })
    if (r.confirm) { await notebookApi.remove(activeNotebook.id); loadNotebooks() }
  }
}
```

- [ ] **Step 5: tsc + weapp 编译 + 提交**

```bash
npx tsc --noEmit
git add src/pages/diary/index.tsx src/pages/diary/index.scss src/pages/diary/index.config.ts
git commit -m "feat(diary-frontend): 日记列表页（header 抽屉 + Swiper 大图卡）"
```

### Task 13: 日记编辑页 pages/diary/edit

**Files:**
- Create: `src/pages/diary/edit.tsx`
- Create: `src/pages/diary/edit.scss`

**Interfaces:**
- Consumes: `RichEditor`、`MoodWeatherPicker`、`diaryApi`、`uploadApi`、`extractImagesInOrder`/`firstImage`（src/utils/publish）
- Produces: 新建/编辑日记页

- [ ] **Step 1: 写 edit.tsx**

参照 `src/pages/publish/index.tsx` 复用 RichEditor（`editorRef`、`getContents`、`setContents`）。要点：
- router.params 读 `id`（编辑）、`notebookId`（新建默认归属）
- state：title、mood、weather、notebookId、submitting
- 编辑模式：`useEffect` 拉 `diaryApi.detail(id)` 回填 title/mood/weather/notebookId + `editorRef.current?.setContents(content)`
- 保存：`const { html, text } = await editorRef.current!.getContents()`；`cover = firstImage(html)`；`images = extractImagesInOrder(html)`；新建 `diaryApi.create({notebookId,title,content:html,cover,mood,weather,images})`，编辑 `diaryApi.update(id, {...})`；成功 `Taro.navigateBack()`
- 顶部标题 input + MoodWeatherPicker + RichEditor

- [ ] **Step 2: 写 edit.scss**（标题 input、区块间距，沿用主题 token）

- [ ] **Step 3: tsc + 提交**

```bash
npx tsc --noEmit
git add src/pages/diary/edit.tsx src/pages/diary/edit.scss
git commit -m "feat(diary-frontend): 日记编辑页（RichEditor + 心情天气 + 图片）"
```

### Task 14: 日记详情页 pages/diary/detail

**Files:**
- Create: `src/pages/diary/detail.tsx`
- Create: `src/pages/diary/detail.scss`

**Interfaces:**
- Consumes: `diaryApi`、`RichText`、`moodEmoji`、`weatherEmoji`、`formatRelativeTime`、`PageLayout`
- Produces: 日记详情页

- [ ] **Step 1: 写 detail.tsx**

参照 `src/pages/detail/index.tsx`。要点：
- router.params 读 `id`
- 拉 `diaryApi.detail(id)`，state 存 diary + loadState
- 展示：封面大图（有则显示）、标题、`moodEmoji/weatherEmoji`、`formatRelativeTime(createdAt)`、`<RichText nodes={diary.content} />`
- 顶部 编辑（`navigateTo edit?id=`）+ 删除（`showModal` 确认 → `diaryApi.remove` → `navigateBack`）

- [ ] **Step 2: 写 detail.scss**

- [ ] **Step 3: tsc + weapp 编译 + 提交**

```bash
npx tsc --noEmit
git add src/pages/diary/detail.tsx src/pages/diary/detail.scss
git commit -m "feat(diary-frontend): 日记详情页（正文 + 心情天气 + 编辑删除）"
```

### Task 15: 全量验证

- [ ] **Step 1: tsc 全量**

```bash
cd /Users/liuyang/mywork/tankingApp/tankingMiniprogram && npx tsc --noEmit
```
Expected: 无错误

- [ ] **Step 2: 单测**

```bash
npx vitest run
```
Expected: 全绿（含新增 diary.test.ts）

- [ ] **Step 3: weapp 编译**

```bash
npm run build:weapp
```
Expected: Compiled successfully，dist/assets/tabbar/diary*.png 存在

- [ ] **Step 4: 勾选 openspec tasks.md**

勾选 `openspec/changes/diary-frontend/tasks.md` 全部项，提交。

---

## 验证清单（build 退出前）

- [ ] 后端 A2 已合并 main，`go build ./... && go test ./...` 通过
- [ ] 前端 tsc 无错误
- [ ] 前端单测全绿
- [ ] weapp 编译成功
- [ ] tabBar 四 tab 顺序正确（首页/日记/消息/我的）
- [ ] openspec tasks.md 全勾选
- [ ] 真机冒烟（verify 阶段）：抽屉切/建/改/删日记本、横滑翻日记、写日记（心情天气图片）、详情编辑删除、四 tab 图标
