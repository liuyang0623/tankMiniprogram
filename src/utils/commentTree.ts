import type { Comment } from '../types/api'

/** 递归将回复插入到 parentId 对应评论的 replies 下（任意深度） */
export function insertReply(list: Comment[], parentId: number, reply: Comment): Comment[] {
  return list.map((c) => {
    if (c.id === parentId) {
      return { ...c, replies: [...(c.replies || []), reply] }
    }
    if (c.replies && c.replies.length > 0) {
      return { ...c, replies: insertReply(c.replies, parentId, reply) }
    }
    return c
  })
}

/** 递归移除任意深度的评论 */
export function removeComment(list: Comment[], id: number): Comment[] {
  return list
    .filter((c) => c.id !== id)
    .map((c) =>
      c.replies && c.replies.length > 0 ? { ...c, replies: removeComment(c.replies, id) } : c,
    )
}
