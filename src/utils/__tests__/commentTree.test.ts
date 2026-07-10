import { describe, it, expect } from 'vitest'
import { insertReply, removeComment } from '../commentTree'
import type { Comment } from '../../types/api'

const c = (id: number, replies: Comment[] = []): Comment => ({ id, content: `c${id}`, replies })

describe('insertReply', () => {
  it('插入到顶层评论的 replies', () => {
    const tree = [c(1), c(2)]
    const r = insertReply(tree, 1, c(10))
    expect(r[0].replies?.map((x) => x.id)).toEqual([10])
    expect(r[1].replies).toEqual([])
  })
  it('插入到深层回复（递归）', () => {
    const tree = [c(1, [c(10, [c(100)])])]
    const r = insertReply(tree, 100, c(1000))
    expect(r[0].replies![0].replies![0].replies?.map((x) => x.id)).toEqual([1000])
  })
})

describe('removeComment', () => {
  it('移除顶层', () => {
    expect(removeComment([c(1), c(2)], 1).map((x) => x.id)).toEqual([2])
  })
  it('移除深层回复', () => {
    const tree = [c(1, [c(10, [c(100)])])]
    const r = removeComment(tree, 100)
    expect(r[0].replies![0].replies).toEqual([])
  })
})
