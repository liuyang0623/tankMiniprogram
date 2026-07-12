import { extractImageUrls } from './richtext'

/** 封面取正文首图（复用 richtext.extractImageUrls），无图返回空串 */
export function firstImage(html: string): string {
  return extractImageUrls(html)[0] ?? ''
}

/** 话题解析：从输入文本收集 #话题 → 去重后的话题名数组 */
export function parseTopics(input: string): string[] {
  const re = /#([^\s#]+)/g
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(input)) !== null) {
    if (!out.includes(m[1])) out.push(m[1])
  }
  return out
}

/** images 保序：按正文 HTML 中图片出现顺序返回全部图片 URL（extractImageUrls 已保序） */
export function extractImagesInOrder(html: string): string[] {
  return extractImageUrls(html)
}

/**
 * 能否保存草稿：后端 content 必填，正文为空一律不保存（无论是否已有 title）。
 * 修复「只写标题触发 create 被后端拒 400 content is required」。
 */
export function canPersistDraft(text: string): boolean {
  return text.trim().length > 0
}
