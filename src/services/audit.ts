import { appConfigApi } from './api/appConfig'
import { usersApi } from './api/users'
import { useAuthStore } from '../store/auth'

export interface AuditModeResponse {
  auditMode: boolean
}

/**
 * 获取当前审核模式状态
 */
export async function getAuditMode(): Promise<boolean> {
  const authStore = useAuthStore.getState()
  if (!authStore.isToken) {
    // 未登录时默认不在审核模式（或者可以根据需求返回其他值）
    return false
  }

  try {
    const response = await appConfigApi.getAuditMode()
    return !!response.auditMode
  } catch (error) {
    console.error('Failed to fetch audit mode:', error)
    // 失败时默认不启用审核模式，确保功能可用
    return false
  }
}

/**
 * 切换审核模式（仅管理员可用）
 */
export async function toggleAuditMode(): Promise<boolean> {
  const authStore = useAuthStore.getState()
  if (!authStore.isLogin || !authStore.user?.isAdmin) {
    throw new Error('Permission denied: Admin only')
  }

  try {
    const currentMode = await getAuditMode()
    const newMode = !currentMode

    const response = await appConfigApi.setAuditMode(newMode)
    // 更新本地缓存（可选）
    Taro.setStorageSync('auditMode', newMode)

    return newMode
  } catch (error) {
    console.error('Failed to toggle audit mode:', error)
    throw error
  }
}

/**
 * 初始化加载审核模式状态和用户信息
 */
export async function initAudit() {
  const authStore = useAuthStore.getState()

  // 如果用户未登录，先获取登录态恢复用户信息
  if (!authStore.isToken) {
    return { auditMode: false, isAdmin: false }
  }

  // 获取用户信息以确认是否为管理员
  try {
    const profile = await usersApi.getProfile()
    const isAdmin = !!profile.isAdmin

    // 尝试获取审核模式状态
    let auditMode = false
    const cachedMode = Taro.getStorageSync('auditMode')
    if (typeof cachedMode === 'boolean') {
      auditMode = cachedMode
    } else {
      try {
        const response = await appConfigApi.getAuditMode()
        auditMode = !!response.auditMode
      } catch (e) {
        console.warn('Could not fetch audit mode, using cached or default', e)
      }
    }

    return { auditMode, isAdmin }
  } catch (error) {
    console.error('Failed to initialize audit:', error)
    return { auditMode: false, isAdmin: false }
  }
}
