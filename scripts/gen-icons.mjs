#!/usr/bin/env node
// 从 iconfont symbol JS 生成图标数据文件 icons.ts。
//
// 用法：node scripts/gen-icons.mjs
// 更新图标：在 iconfont.cn 修改图标 → 重跑本脚本 → icons.ts 全量刷新。
//
// 读取 iconfont.json 的 symbol_url，拉取 symbol JS，解析所有
// <symbol id viewBox>...path...</symbol>，输出 name → {viewBox, paths}。
// 不依赖 taro-iconfont-cli（其在 bun 环境的 __importDefault().sync 崩溃）。

import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

function readConfig() {
  const cfgPath = path.join(root, 'iconfont.json')
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
  if (!cfg.symbol_url) throw new Error('iconfont.json 缺少 symbol_url')
  return cfg
}

function fetchText(url) {
  const full = url.startsWith('//') ? 'https:' + url : url
  return new Promise((resolve, reject) => {
    https
      .get(full, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`拉取失败 ${res.statusCode}: ${full}`))
          return
        }
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => resolve(data))
      })
      .on('error', reject)
  })
}

// 解析 symbol JS 里所有 <symbol id="..." viewBox="...">...</symbol>
function parseSymbols(js, trimPrefix) {
  const symbols = {}
  const re = /<symbol id="([^"]+)"[^>]*viewBox="([^"]+)"[^>]*>(.*?)<\/symbol>/gs
  let m
  while ((m = re.exec(js)) !== null) {
    let name = m[1]
    if (trimPrefix && name.startsWith(trimPrefix + '-')) {
      name = name.slice(trimPrefix.length + 1)
    } else if (trimPrefix && name.startsWith(trimPrefix)) {
      name = name.slice(trimPrefix.length)
    }
    const viewBox = m[2]
    // 提取所有 <path d="..."/>，去掉写死的 fill（运行时染色）
    const paths = []
    const pathRe = /<path[^>]*\bd="([^"]+)"[^>]*\/?>/g
    let p
    while ((p = pathRe.exec(m[3])) !== null) {
      paths.push(p[1])
    }
    if (paths.length) symbols[name] = { viewBox, paths }
  }
  return symbols
}

function genFile(symbols) {
  const names = Object.keys(symbols).sort()
  const entries = names
    .map((n) => {
      const { viewBox, paths } = symbols[n]
      const pathsStr = paths.map((d) => JSON.stringify(d)).join(', ')
      return `  ${JSON.stringify(n)}: { viewBox: ${JSON.stringify(viewBox)}, paths: [${pathsStr}] },`
    })
    .join('\n')

  return `// 本文件由 scripts/gen-icons.mjs 自动生成，请勿手改。
// 更新图标：在 iconfont.cn 修改后重跑 \`node scripts/gen-icons.mjs\`。

export interface IconData {
  viewBox: string
  paths: string[]
}

export const ICONS: Record<string, IconData> = {
${entries}
}

export type IconName = keyof typeof ICONS
`
}

async function main() {
  const cfg = readConfig()
  console.log('拉取 symbol JS:', cfg.symbol_url)
  const js = await fetchText(cfg.symbol_url)
  const symbols = parseSymbols(js, cfg.trim_icon_prefix)
  const names = Object.keys(symbols)
  if (!names.length) throw new Error('未解析到任何图标，检查 symbol_url')
  console.log(`解析到 ${names.length} 个图标:`, names.join(', '))

  const outFile = path.resolve(root, cfg.out_file || './src/components/Iconfont/icons.ts')
  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  fs.writeFileSync(outFile, genFile(symbols), 'utf8')
  console.log('已写入:', path.relative(root, outFile))
}

main().catch((e) => {
  console.error('生成失败:', e.message)
  process.exit(1)
})
