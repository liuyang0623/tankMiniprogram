import { create } from 'zustand'
import Taro from '@tarojs/taro'
import { initAudit, getAuditMode, toggleAuditMode } from '../services/audit'

const AUDIT_MODE_KEY = 'auditMode'

interface AuditState {
  isAuditMode: boolean | null // null = loading
  isAdmin: boolean
  /** 初始化加载审核状态和用户信息 */
  load: Promise<void>
  /** 设置审核模式状态（用于测试等场景） */
  setIsAuditMode: (mode: boolean) => void
  /** 设置管理员标识 */
  setIsAdmin: (isAdmin: boolean) => void
  /** 切换审核模式 */
  toggleAuditMode: () => Promise<boolean>
}

export const useAuditStore = create<AuditState>((set, get) => ({
  isAuditMode: null,
  isAdmin: false,

  load: (async () => {
    // 从本地存储恢复审计模式状态（如果有）
    const cachedMode = Taro.getStorageSync(AUDIT_MODE_KEY)
    if (typeof cachedMode === 'boolean') {
      set({ isAuditMode: cachedMode })
    }

    try {
      const { auditMode, isAdmin } = await initAudit()
      set({ isAuditMode: auditMode, isAdmin })
    } catch (error) {
      console.error('Failed to initialize audit state:', error)
      // 初始化失败时默认关闭审核模式
      set({ isAuditMode: false, isAdmin: false })
    }
  }) as Promise<void>,

  setIsAuditMode: (mode) => {
    set({ isAuditMode: mode })
    Taro.setStorageSync(AUDIT_MODE_KEY, mode)
  },

  setIsAdmin: (isAdmin) => {
    set({ isAdmin })
  },

  toggleAuditMode: async () => {
    const currentMode = get().isAuditMode ?? false
    const newMode = !currentMode

    // 调用服务层进行切换
    await toggleAuditMode()

    // 更新本地状态
    set({ isAuditMode: newMode })
    Taro.setStorageSync(AUDIT_MODE_KEY, newMode)

    return newMode
  },
}))
