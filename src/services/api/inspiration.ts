import { authRequest } from '../authRequest'
import type {
  Question, QuestionListItem, Answer, PaginatedQuestions,
  CreateQuestionBody, CreateAnswerBody,
  SportGoal, CheckinResult, CreateSportGoalBody, UpdateSportGoalBody,
} from '../../types/inspiration'

/** 解惑问答（全站公开互助） */
export const qaApi = {
  /** 全站问题列表（分页） */
  list: (p?: { page?: number; limit?: number }) =>
    authRequest<PaginatedQuestions>({
      url: `/questions?page=${p?.page ?? 1}&limit=${p?.limit ?? 10}`,
    }),
  /** 问题详情（含回答） */
  detail: (id: number) => authRequest<Question>({ url: `/questions/${id}` }),
  /** 提问 */
  create: (body: CreateQuestionBody) =>
    authRequest<Question>({ url: '/questions', method: 'POST', data: body }),
  /** 回答某个问题 */
  answer: (questionId: number, body: CreateAnswerBody) =>
    authRequest<Answer>({ url: `/questions/${questionId}/answers`, method: 'POST', data: body }),
}

/** 运动计划（按天连续打卡） */
export const sportApi = {
  /** 我的运动目标列表 */
  list: () => authRequest<SportGoal[]>({ url: '/sport-goals' }),
  /** 创建运动目标 */
  create: (body: CreateSportGoalBody) =>
    authRequest<SportGoal>({ url: '/sport-goals', method: 'POST', data: body }),
  /** 更新运动目标 */
  update: (id: number, body: UpdateSportGoalBody) =>
    authRequest<SportGoal>({ url: `/sport-goals/${id}`, method: 'PATCH', data: body }),
  /** 打卡 */
  checkin: (id: number) =>
    authRequest<CheckinResult>({ url: `/sport-goals/${id}/checkin`, method: 'POST' }),
}
