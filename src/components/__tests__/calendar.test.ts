import { describe, it, expect } from 'vitest'
import { buildMonthGrid, shiftMonth, toDateKey, toMonthKey } from '../CheckinCalendar/calendar'

describe('calendar utils', () => {
  it('toDateKey 本地补零', () => {
    expect(toDateKey(new Date(2026, 6, 5))).toBe('2026-07-05')
    expect(toDateKey(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('toMonthKey 补零', () => {
    expect(toMonthKey(2026, 7)).toBe('2026-07')
    expect(toMonthKey(2026, 12)).toBe('2026-12')
  })

  it('shiftMonth 跨年安全', () => {
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 })
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 })
    expect(shiftMonth(2026, 7, -2)).toEqual({ year: 2026, month: 5 })
  })

  describe('buildMonthGrid', () => {
    // 2026-07：7 月 1 日为周三，共 31 天
    const done = new Set(['2026-07-19', '2026-07-20'])
    const today = '2026-07-20'
    const cells = buildMonthGrid(2026, 7, done, today)

    it('前导空格数等于当月 1 号星期', () => {
      const leading = cells.filter((c) => c.state === 'blank').length
      expect(leading).toBe(new Date(2026, 6, 1).getDay()) // 周三=3
    })

    it('总格子数 = 前导 + 天数', () => {
      expect(cells.length).toBe(new Date(2026, 6, 1).getDay() + 31)
    })

    it('已打卡日标 done，今天打卡标 today-done', () => {
      const d19 = cells.find((c) => c.key === '2026-07-19')
      const d20 = cells.find((c) => c.key === '2026-07-20')
      expect(d19?.state).toBe('done')
      expect(d20?.state).toBe('today-done')
    })

    it('今天之前未打卡为 miss，之后为 future', () => {
      const d10 = cells.find((c) => c.key === '2026-07-10')
      const d25 = cells.find((c) => c.key === '2026-07-25')
      expect(d10?.state).toBe('miss')
      expect(d25?.state).toBe('future')
    })

    it('今天未打卡时为 today-miss', () => {
      const cells2 = buildMonthGrid(2026, 7, new Set(), '2026-07-20')
      const d20 = cells2.find((c) => c.key === '2026-07-20')
      expect(d20?.state).toBe('today-miss')
    })
  })
})
