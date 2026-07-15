import { authRequest } from '../authRequest'
import type {
  Diary, PaginatedDiaries, CreateDiaryBody, UpdateDiaryBody,
  Notebook, CreateNotebookBody, UpdateNotebookBody,
} from '../../types/diary'

export const notebookApi = {
  /** 我的日记本列表（后端自动建默认本） */
  list: () => authRequest<Notebook[]>({ url: '/notebooks' }),
  /** 新建日记本 */
  create: (body: CreateNotebookBody) =>
    authRequest<Notebook>({ url: '/notebooks', method: 'POST', data: body }),
  /** 改日记本 */
  update: (id: number, body: UpdateNotebookBody) =>
    authRequest<Notebook>({ url: `/notebooks/${id}`, method: 'PATCH', data: body }),
  /** 删日记本 */
  remove: (id: number) => authRequest<void>({ url: `/notebooks/${id}`, method: 'DELETE' }),
}

export const diaryApi = {
  /** 某日记本的日记列表（分页时间线） */
  list: (p: { notebookId: number; page?: number }) =>
    authRequest<PaginatedDiaries>({ url: `/diaries?notebookId=${p.notebookId}&page=${p.page ?? 1}` }),
  /** 日记详情 */
  detail: (id: number) => authRequest<Diary>({ url: `/diaries/${id}` }),
  /** 新建日记 */
  create: (body: CreateDiaryBody) => authRequest<Diary>({ url: '/diaries', method: 'POST', data: body }),
  /** 改日记 */
  update: (id: number, body: UpdateDiaryBody) =>
    authRequest<Diary>({ url: `/diaries/${id}`, method: 'PATCH', data: body }),
  /** 删日记 */
  remove: (id: number) => authRequest<void>({ url: `/diaries/${id}`, method: 'DELETE' }),
}
