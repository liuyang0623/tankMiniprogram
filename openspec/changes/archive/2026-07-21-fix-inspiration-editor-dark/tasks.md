# Implementation Tasks — fix-inspiration-editor-dark

## 1. RichEditor 暗色适配

- [x] 1.1 `src/components/RichEditor/index.scss` 三处写死浅色改用主题变量：`.tool-btn`/`.panel-btn` 底色 `#faf6f0` → `var(--c-card-soft)`；`.tool-txt`/`.panel-btn-txt` 文字 `#4a4038` → `var(--c-ink)`；`.editor-body` 底色 `#ffffff` → `var(--c-card)`
- [x] 1.2 根因消除检查：`grep -nE "#(faf6f0|4a4038|ffffff)" src/components/RichEditor/index.scss` 无残留
- [x] 1.3 `tsc` + `build:weapp` 编译通过
