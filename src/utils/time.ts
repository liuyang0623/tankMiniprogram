/**
 * 相对时间格式化：刚刚 / x分钟前 / x小时前 / x天前 / 年月日。
 * ≥30 天显示年月日（今年省略年份）。空/非法/未来时间做兜底。
 */
export function formatRelativeTime(iso: string): string {
  if (!iso) return ''
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const diff = Date.now() - t
  if (diff < 60_000) return '刚刚' // 含未来时间兜底（diff < 0）
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}分钟前`
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}小时前`
  if (diff < 2592000_000) return `${Math.floor(diff / 86400_000)}天前`
  const d = new Date(iso)
  const now = new Date()
  const md = `${d.getMonth() + 1}月${d.getDate()}日`
  return d.getFullYear() === now.getFullYear() ? md : `${d.getFullYear()}年${md}`
}
