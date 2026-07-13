import { describe, it, expect } from 'vitest'
import { resolveTheme } from '../theme'

describe('resolveTheme', () => {
  it('light 模式返回 light', () => {
    expect(resolveTheme('light', 'dark')).toBe('light')
  })
  it('dark 模式返回 dark', () => {
    expect(resolveTheme('dark', 'light')).toBe('dark')
  })
  it('system 模式跟随系统深色', () => {
    expect(resolveTheme('system', 'dark')).toBe('dark')
  })
  it('system 模式跟随系统浅色', () => {
    expect(resolveTheme('system', 'light')).toBe('light')
  })
})
