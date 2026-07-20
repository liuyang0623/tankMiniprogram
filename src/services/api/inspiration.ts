import { authRequest } from '../authRequest'
import type {
  Question, QuestionListItem, Answer, PaginatedQuestions,
  CreateQuestionBody, CreateAnswerBody, AnswerLikeResult,
  SportGoal, CheckinResult, CreateSportGoalBody, UpdateSportGoalBody, MonthRecords,
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
  /** 点赞/取消点赞某条回答（toggle） */
  likeAnswer: (questionId: number, answerId: number) =>
    authRequest<AnswerLikeResult>({
      url: `/questions/${questionId}/answers/${answerId}/like`,
      method: 'POST',
    }),
  /** 提问者采纳某条回答 */
  acceptAnswer: (questionId: number, answerId: number) =>
    authRequest<{ questionId: number; acceptedAnswerId: number }>({
      url: `/questions/${questionId}/accept/${answerId}`,
      method: 'POST',
    }),
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
  /** 某目标某月打卡日期列表（YYYY-MM） */
  monthRecords: (id: number, month: string) =>
    authRequest<MonthRecords>({ url: `/sport-goals/${id}/records?month=${month}` }),
}
