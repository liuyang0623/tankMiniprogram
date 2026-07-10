/** 从富文本 HTML 中提取所有图片 URL，供 Taro.previewImage 使用 */
export function extractImageUrls(html: string): string[] {
  if (!html) return []
  const urls: string[] = []
  const re = /<img[^>]+src=["']([^"']+)["']/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    urls.push(m[1])
  }
  return urls
}
