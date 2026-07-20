import type { Paginated } from './api'

// ── 解惑问答 ──

/** 回答 */
export interface Answer {
  id: number
  authorId: number
  content: string
  createdAt: string
}

/** 问题详情（含回答列表） */
export interface Question {
  id: number
  authorId: number
  title: string
  content: string
  answerCount: number
  answers: Answer[]
  createdAt: string
  updatedAt: string
}

/** 问题列表项 */
export interface QuestionListItem {
  id: number
  authorId: number
  title: string
  answerCount: number
  createdAt: string
}

export type PaginatedQuestions = Paginated<QuestionListItem>

export interface CreateQuestionBody {
  title: string
  content?: string
}

export interface CreateAnswerBody {
  content: string
}

// ── 运动计划 ──

/** 运动目标 */
export interface SportGoal {
  id: number
  name: string
  type?: string
  icon?: string
  targetDays: number
  streak: number
  totalDays: number
  checkedInToday: boolean
  lastCheckinAt?: string
  createdAt: string
}

/** 打卡结果 */
export interface CheckinResult {
  goalId: number
  streak: number
  totalDays: number
  checkedInToday: boolean
  /** 本次是否新增打卡（false=同日重复） */
  awarded: boolean
}

export interface CreateSportGoalBody {
  name: string
  type?: string
  icon?: string
  targetDays?: number
}

export interface UpdateSportGoalBody {
  name?: string
  type?: string
  icon?: string
  targetDays?: number
}
