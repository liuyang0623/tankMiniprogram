import { create } from 'zustand'
import Taro from '@tarojs/taro'
import { appConfigApi } from '../services/api/appConfig'
import { usersApi } from '../services/api/users'

interface AuditState {
  isAuditMode: boolean
  isAdmin: boolean
  load: () => Promise<void>
  setIsAuditMode: (mode: boolean) => void
  setIsAdmin: (isAdmin: boolean) => void
  toggleAuditMode: () => Promise<boolean>
}

export const useAuditStore = create<AuditState>((set, get) => ({
  isAuditMode: true, // Secure default: audit mode ON
  isAdmin: false,

  load: async () => {
    try {
      // Always default to true; only become false if API explicitly says so
      let mode = true
      try {
        const response = await appConfigApi.getAuditMode()
        if (!response.auditMode) mode = false
      } catch (e) {
        console.warn('Using secure default auditMode=true')
      }
      set({ isAuditMode: mode })

      const token = Taro.getStorageSync('blr_token')
      if (token) {
        try {
          const profile = await usersApi.getProfile()
          set({ isAdmin: !!profile.isAdmin })
        } catch (e) {
          console.error('Could not check admin status')
        }
      }
    } catch (e) {
      console.error('Audit init failed, staying in secure mode')
      set({ isAuditMode: true, isAdmin: false })
    }
  },

  setIsAuditMode: (mode) => set({ isAuditMode: mode }),

  setIsAdmin: (admin) => set({ isAdmin: admin }),

  toggleAuditMode: async () => {
    const current = get().isAuditMode
    const next = !current
    try {
      await appConfigApi.setAuditMode(next)
      set({ isAuditMode: next })
      return next
    } catch (e) {
      console.error('Toggle failed', e)
      throw e
    }
  },
}))
