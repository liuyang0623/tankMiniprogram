// go-service /api/v1 接口契约类型
// 契约已核对 pkg/response（成功 code===200）与各 service response struct

export type PostStatus = 'DRAFT' | 'PUBLISHED'

/** 后端统一响应包裹：{ data, code, message }，成功 code===200 */
export interface ApiEnvelope<T> {
  data: T
  code: number
  message: string
}

export interface User {
  id: number
  nickname: string
  avatar: string
  bio: string
  gender: number
  phone?: string
  /** 获赞总数（他人主页展示，后端可选返回） */
  likeCount?: number
  /** 粉丝数（关注该用户的人数） */
  followerCount?: number
  /** 关注数（该用户关注的人数） */
  followingCount?: number
  /** 当前登录用户是否已关注该用户（未登录/自己时为 false） */
  isFollowing?: boolean
}

/** 关注/粉丝列表项 */
export interface FollowUserItem {
  id: number
  nickname: string
  avatar: string
  bio: string
  isFollowing: boolean
}

/** 关注/粉丝分页返回 */
export type PaginatedFollowUsers = Paginated<FollowUserItem>

/** 帖子作者精简信息（昵称 json tag 为 name） */
export interface PostAuthor {
  id: number
  name: string
  avatar: string
}

/** 帖子配图（排序 json tag 为 order） */
export interface PostImage {
  id: number
  url: string
  order: number
}

export interface Topic {
  id: number
  name: string
}

export interface Post {
  id: number
  title: string
  content: string
  cover?: string
  status: PostStatus
  authorId: number
  author: PostAuthor
  viewCount: number
  likeCount: number
  commentCount: number
  images?: PostImage[]
  topics?: Topic[]
  // 当前登录用户对该帖的互动态（详情接口返回）
  isLiked?: boolean
  isFavorited?: boolean
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

export interface Comment {
  id: number
  content: string
  parentId?: number
  replies?: Comment[]
  createdAt?: string
  authorId?: number
  author?: PostAuthor
  // 评论点赞：后端暂无接口，前端本地乐观字段
  likeCount?: number
  isLiked?: boolean
}

/** 分页元信息 */
export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

/** 分页返回：{ data: T[], meta } */
export interface Paginated<T> {
  data: T[]
  meta: PaginationMeta
}

/** 登录返回的用户精简信息 */
export interface LoginUser {
  id: number
  nickname: string
  avatar: string
}

export interface AuthResponse {
  token: string
  user: LoginUser
}

/** 评论分页返回 */
export type PaginatedComments = Paginated<Comment>

/** 收藏项：包裹帖子与收藏时间 */
export interface FavoriteItem {
  post: Post
  favoritedAt: string
}

/** 收藏分页返回 */
export type PaginatedFavorites = Paginated<FavoriteItem>

// ── 消息/私信 ──

/** 会话列表中的对方用户精简信息 */
export interface OtherUserInfo {
  id: number
  nickname: string
  avatar: string
}

/** 会话列表项 */
export interface ConversationItem {
  id: number
  otherUser: OtherUserInfo
  lastMessage: string
  lastTime: string
  unreadCount: number
}

/** 消息项 */
export interface MessageItem {
  id: number
  conversationId: number
  senderId: number
  type: 'text' | 'image'
  content: string
  createdAt: string
}

/** 会话列表分页返回 */
export type PaginatedConversations = Paginated<ConversationItem>

/** 消息列表分页返回 */
export type PaginatedMessages = Paginated<MessageItem>

/** WebSocket 推送的消息包裹 */
export interface WsMessageEnvelope {
  type: 'new_message'
  data: MessageItem
}
