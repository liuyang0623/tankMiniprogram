/** 主题模式：亮 / 暗 / 跟随系统 */
export type Mode = 'light' | 'dark' | 'system'
/** 解析后的实际主题（只有亮暗两种） */
export type Resolved = 'light' | 'dark'

/** 由模式与系统主题解析出实际主题；system 时跟随系统，否则用模式本身 */
export function resolveTheme(mode: Mode, systemTheme: Resolved): Resolved {
  return mode === 'system' ? systemTheme : mode
}
