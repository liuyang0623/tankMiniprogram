import { create } from 'zustand'
import { appConfigApi } from '../services/api'

interface AuditState {
  /** 审核模式开关。true=隐藏首页/消息 tab 及灵感解惑板块。 */
  auditMode: boolean
  /** 是否已完成一次配置拉取（无论成功失败） */
  loaded: boolean
  /** 启动初始化：拉取全局配置；失败降级为正常模式（auditMode=false） */
  load: () => Promise<void>
}

export const useAuditStore = create<AuditState>((set) => ({
  auditMode: false,
  loaded: false,

  load: async () => {
    try {
      const { auditMode } = await appConfigApi.get()
      set({ auditMode, loaded: true })
    } catch {
      // 拉取失败按正常模式，保证接口异常/表未 seed 时应用可用
      set({ auditMode: false, loaded: true })
    }
  },
}))
