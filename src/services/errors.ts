/** 规范化 API 错误 */
export class ApiError extends Error {
  constructor(
    public code: number,
    message: string,
    public httpStatus: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
