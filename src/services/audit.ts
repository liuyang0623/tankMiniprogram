import { appConfigApi } from './api/appConfig'

/**
 * 获取当前审核模式状态
 */
export async function getAuditMode(): Promise<boolean> {
  try {
    const response = await appConfigApi.getAuditMode()
    return !!response.auditMode
  } catch (error) {
    console.error('Failed to fetch audit mode:', error)
    return false
  }
}
