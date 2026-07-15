import { describe, it, expect } from 'vitest'
import { moodEmoji, weatherEmoji, MOODS, WEATHERS } from '../diary'

describe('diary 心情天气映射', () => {
  it('moodEmoji 命中', () => {
    expect(moodEmoji('happy')).toBe('😊')
  })
  it('moodEmoji 未知返回空', () => {
    expect(moodEmoji('xxx')).toBe('')
  })
  it('weatherEmoji 命中', () => {
    expect(weatherEmoji('sunny')).toBe('☀️')
  })
  it('weatherEmoji 未知返回空', () => {
    expect(weatherEmoji('')).toBe('')
  })
  it('选项集各 5 项', () => {
    expect(MOODS.length).toBe(5)
    expect(WEATHERS.length).toBe(5)
  })
})
