import { request } from '../request'
import { authRequest } from '../authRequest'
import type { AppConfig } from '../../types/api'

export interface AuditModeToggleBody {
  auditMode: boolean
}

export const appConfigApi = {
  /** 获取审核模式状态 */
  getAuditMode: () => authRequest<AppConfig>({ url: '/app-config' }),

  /** 设置审核模式（管理员使用） */
  setAuditMode: (auditMode: boolean) =>
    authRequest<AppConfig>({ url: '/app-config', method: 'PUT', data: { auditMode } }),
}
