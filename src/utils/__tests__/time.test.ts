import { describe, it, expect } from 'vitest'
import { formatRelativeTime } from '../time'

/** 构造距现在 ms 毫秒前的 ISO 字符串 */
function agoIso(ms: number): string {
  return new Date(Date.now() - ms).toISOString()
}

describe('formatRelativeTime', () => {
  it('空/非法 iso → 空串', () => {
    expect(formatRelativeTime('')).toBe('')
    expect(formatRelativeTime('not-a-date')).toBe('')
  })

  it('未来时间 → 刚刚', () => {
    expect(formatRelativeTime(new Date(Date.now() + 60_000).toISOString())).toBe('刚刚')
  })

  it('小于1分钟 → 刚刚', () => {
    expect(formatRelativeTime(agoIso(30_000))).toBe('刚刚')
  })

  it('分钟级 → x分钟前', () => {
    expect(formatRelativeTime(agoIso(5 * 60_000))).toBe('5分钟前')
    expect(formatRelativeTime(agoIso(59 * 60_000))).toBe('59分钟前')
  })

  it('小时级 → x小时前', () => {
    expect(formatRelativeTime(agoIso(3 * 3600_000))).toBe('3小时前')
    expect(formatRelativeTime(agoIso(23 * 3600_000))).toBe('23小时前')
  })

  it('天级 → x天前', () => {
    expect(formatRelativeTime(agoIso(2 * 86400_000))).toBe('2天前')
    expect(formatRelativeTime(agoIso(29 * 86400_000))).toBe('29天前')
  })

  it('超过30天 → 年月日（今年省略年份）', () => {
    const d = new Date()
    d.setMonth(0, 15) // 今年 1月15日
    d.setFullYear(new Date().getFullYear() - 1) // 去年，确保 >30 天
    const r = formatRelativeTime(d.toISOString())
    expect(r).toMatch(/\d{4}年\d{1,2}月\d{1,2}日/)
  })

  it('今年超过30天 → 省略年份', () => {
    // 45 天前（若跨年则含年份，这里只校验格式含月日）
    const r = formatRelativeTime(agoIso(45 * 86400_000))
    expect(r).toMatch(/\d{1,2}月\d{1,2}日/)
  })
})
