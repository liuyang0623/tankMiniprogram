/** 日历纯函数工具：与视图解耦，便于单测。 */

/** 把 Date 格式化为本地 YYYY-MM-DD（与后端 records 对齐）。 */
export function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 当前年月格式化为 YYYY-MM，用于请求参数。 */
export function toMonthKey(year: number, month: number): string {
  return `${year}-${`${month}`.padStart(2, '0')}`
}

export type DayCellState = 'blank' | 'done' | 'miss' | 'future' | 'today-done' | 'today-miss'

export interface DayCell {
  key: string // YYYY-MM-DD，blank 时为占位空串
  day: number // 该月第几天，blank 为 0
  state: DayCellState
}

/**
 * 构建某年某月的日历网格（含首周前导空格），并对每天判定状态。
 * - done: 已打卡；miss: 今天之前且未打卡；future: 今天之后；today-done/today-miss: 今天两态。
 * @param year 年
 * @param month 1-12
 * @param doneDates 已打卡日期集合（YYYY-MM-DD）
 * @param todayKey 今天的 YYYY-MM-DD（注入以便测试）
 */
export function buildMonthGrid(
  year: number,
  month: number,
  doneDates: Set<string>,
  todayKey: string,
): DayCell[] {
  const firstDay = new Date(year, month - 1, 1)
  const leading = firstDay.getDay() // 0=周日
  const daysInMonth = new Date(year, month, 0).getDate()

  const cells: DayCell[] = []
  for (let i = 0; i < leading; i++) {
    cells.push({ key: '', day: 0, state: 'blank' })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${`${month}`.padStart(2, '0')}-${`${d}`.padStart(2, '0')}`
    const done = doneDates.has(key)
    let state: DayCellState
    if (key === todayKey) {
      state = done ? 'today-done' : 'today-miss'
    } else if (done) {
      state = 'done'
    } else if (key < todayKey) {
      state = 'miss'
    } else {
      state = 'future'
    }
    cells.push({ key, day: d, state })
  }
  return cells
}

/** 上/下月计算，跨年安全。dir: -1 上月, +1 下月。 */
export function shiftMonth(year: number, month: number, dir: number): { year: number; month: number } {
  const zero = month - 1 + dir
  return {
    year: year + Math.floor(zero / 12),
    month: ((zero % 12) + 12) % 12 + 1,
  }
}
