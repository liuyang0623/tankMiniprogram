import { describe, it, expect } from 'vitest'
import { extractImageUrls } from '../richtext'

describe('extractImageUrls', () => {
  it('提取多张图片 src', () => {
    const html = '<p>hi</p><img src="https://a.com/1.png" /><img src=\'https://a.com/2.jpg\'>'
    expect(extractImageUrls(html)).toEqual(['https://a.com/1.png', 'https://a.com/2.jpg'])
  })
  it('无图返回空数组', () => {
    expect(extractImageUrls('<p>纯文本</p>')).toEqual([])
    expect(extractImageUrls('')).toEqual([])
  })
})
