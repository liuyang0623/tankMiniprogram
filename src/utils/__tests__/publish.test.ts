import { describe, it, expect } from 'vitest'
import { firstImage, parseTopics, extractImagesInOrder, canPersistDraft } from '../publish'

describe('firstImage', () => {
  it('多图取首图', () => {
    const html = '<p>hi</p><img src="https://a.com/1.png" /><img src="https://a.com/2.jpg">'
    expect(firstImage(html)).toBe('https://a.com/1.png')
  })
  it('单图取该图', () => {
    expect(firstImage('<img src="https://a.com/x.png">')).toBe('https://a.com/x.png')
  })
  it('无图返回空串', () => {
    expect(firstImage('<p>纯文本</p>')).toBe('')
    expect(firstImage('')).toBe('')
  })
})

describe('parseTopics', () => {
  it('单个话题', () => {
    expect(parseTopics('今天好累 #摆烂')).toEqual(['摆烂'])
  })
  it('多个话题', () => {
    expect(parseTopics('#摆烂 #周末 #躺平')).toEqual(['摆烂', '周末', '躺平'])
  })
  it('去重', () => {
    expect(parseTopics('#摆烂 又 #摆烂')).toEqual(['摆烂'])
  })
  it('无话题返回空数组', () => {
    expect(parseTopics('普通文本没有标签')).toEqual([])
    expect(parseTopics('')).toEqual([])
  })
})

describe('extractImagesInOrder', () => {
  it('按出现顺序返回全部图片 URL', () => {
    const html = '<img src="https://a.com/1.png"><p>x</p><img src="https://a.com/2.jpg">'
    expect(extractImagesInOrder(html)).toEqual(['https://a.com/1.png', 'https://a.com/2.jpg'])
  })
  it('无图返回空数组', () => {
    expect(extractImagesInOrder('<p>纯文本</p>')).toEqual([])
  })
})

describe('canPersistDraft', () => {
  it('正文非空可保存', () => {
    expect(canPersistDraft('今天好累')).toBe(true)
  })
  it('正文为空不保存（即使只写了标题）', () => {
    // 复现 bug：只写标题、正文空时不应触发保存（后端 content 必填）
    expect(canPersistDraft('')).toBe(false)
    expect(canPersistDraft('   ')).toBe(false)
  })
})
