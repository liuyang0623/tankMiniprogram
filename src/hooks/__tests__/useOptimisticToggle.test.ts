import { describe, it, expect } from 'vitest'
import { nextToggleState } from '../useOptimisticToggle'

describe('nextToggleState', () => {
  it('未激活→激活，计数+1', () => {
    expect(nextToggleState({ active: false, count: 2 })).toEqual({ active: true, count: 3 })
  })
  it('激活→未激活，计数-1', () => {
    expect(nextToggleState({ active: true, count: 3 })).toEqual({ active: false, count: 2 })
  })
  it('计数不为负', () => {
    expect(nextToggleState({ active: true, count: 0 })).toEqual({ active: false, count: 0 })
  })
})
