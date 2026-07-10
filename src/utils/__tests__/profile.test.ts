import { describe, it, expect } from 'vitest'
import { collectChanges } from '../profile'

describe('collectChanges', () => {
  it('只收集变更字段', () => {
    expect(collectChanges({ nickname: 'a', bio: 'x' }, { nickname: 'a', bio: 'y' })).toEqual({ bio: 'y' })
  })
  it('无变更返回空对象', () => {
    expect(collectChanges({ nickname: 'a', gender: 0 }, { nickname: 'a', gender: 0 })).toEqual({})
  })
  it('多字段变更全部收集', () => {
    expect(collectChanges({ nickname: 'a', bio: 'x' }, { nickname: 'b', bio: 'y' })).toEqual({
      nickname: 'b',
      bio: 'y',
    })
  })
})
