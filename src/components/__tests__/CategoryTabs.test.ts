import { describe, it, expect } from 'vitest'
import { tabToQuery } from '../CategoryTabs/helpers'

describe('tabToQuery', () => {
  it('关注 tab → following', () => {
    expect(tabToQuery('following')).toEqual({ following: true })
  })

  it('推荐 tab → sort=likes', () => {
    expect(tabToQuery('recommend')).toEqual({ sort: 'likes' })
  })

  it('其他 tab → category=none', () => {
    expect(tabToQuery('other')).toEqual({ category: 'none' })
  })

  it('真实分类 → category=<key>', () => {
    expect(tabToQuery('story')).toEqual({ category: 'story' })
    expect(tabToQuery('tech')).toEqual({ category: 'tech' })
    expect(tabToQuery('travel')).toEqual({ category: 'travel' })
  })
})
