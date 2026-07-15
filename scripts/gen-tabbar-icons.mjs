#!/usr/bin/env node
// 生成 tabBar 图标 PNG。
//
// 用法：node scripts/gen-tabbar-icons.mjs
// 小程序 tabBar 只支持本地 PNG（不支持 svg/字体图标）。本脚本从 icons.ts
// 提取 tabBar 用到的单色图标，拼 svg 注入颜色，用 ImageMagick 转 81×81 PNG。
// 每图标 2 套色：未选 #8A7F76 / 选中 #F0A868。产物入 git（图标不常变）。
//
// 依赖：ImageMagick（magick 命令）。

import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

// tabBar 图标：iconfont name → 输出文件名
const TABBAR_ICONS = [
  { icon: 'shouye', out: 'home' },
  { icon: 'shu_o', out: 'diary' }, // 日记 tab（书本图标）
  { icon: 'xiaoxi_o', out: 'message' },
  { icon: 'gerentouxiang_o', out: 'profile' },
]

const COLORS = {
  normal: '#8A7F76', // 未选
  active: '#F0A868', // 选中
}

const SIZE = 81

// 从 icons.ts 解析 name → {viewBox, paths}
function loadIcons() {
  const src = fs.readFileSync(path.join(root, 'src/components/Iconfont/icons.ts'), 'utf8')
  const icons = {}
  const re = /"([^"]+)":\s*\{\s*viewBox:\s*"([^"]+)",\s*paths:\s*\[([^\]]*)\]/g
  let m
  while ((m = re.exec(src)) !== null) {
    const name = m[1]
    const viewBox = m[2]
    const paths = (m[3].match(/"((?:[^"\\]|\\.)*)"/g) || []).map((s) => JSON.parse(s))
    icons[name] = { viewBox, paths }
  }
  return icons
}

function buildSvg(icon, color) {
  const paths = icon.paths.map((d) => `<path d="${d}" fill="${color}"/>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox}" width="${SIZE}" height="${SIZE}">${paths}</svg>`
}

function main() {
  const icons = loadIcons()
  const outDir = path.join(root, 'src/assets/tabbar')
  fs.mkdirSync(outDir, { recursive: true })
  const tmpDir = fs.mkdtempSync(path.join(root, '.tabbar-tmp-'))

  try {
    for (const { icon, out } of TABBAR_ICONS) {
      const data = icons[icon]
      if (!data) {
        console.error(`图标 ${icon} 未在 icons.ts 中找到，跳过`)
        continue
      }
      for (const [variant, color] of Object.entries(COLORS)) {
        const suffix = variant === 'active' ? '-active' : ''
        const svgPath = path.join(tmpDir, `${out}${suffix}.svg`)
        const pngPath = path.join(outDir, `${out}${suffix}.png`)
        fs.writeFileSync(svgPath, buildSvg(data, color))
        // 方案一：直接 81×81，-background none 保持透明，默认抗锯齿
        execFileSync('magick', ['-background', 'none', svgPath, '-resize', `${SIZE}x${SIZE}`, pngPath])
        console.log(`生成 ${path.relative(root, pngPath)}`)
      }
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
  console.log('tabBar 图标生成完成')
}

main()
