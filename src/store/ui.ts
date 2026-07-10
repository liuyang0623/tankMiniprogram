import { create } from 'zustand'

export type ToastType = 'info' | 'success' | 'error'

interface ToastState {
  visible: boolean
  message: string
  type: ToastType
}

interface UiState {
  globalLoading: boolean
  toast: ToastState
  setGlobalLoading: (v: boolean) => void
  showToast: (message: string, type?: ToastType) => void
  hideToast: () => void
}

let toastTimer: ReturnType<typeof setTimeout> | null = null

export const useUiStore = create<UiState>((set) => ({
  globalLoading: false,
  toast: { visible: false, message: '', type: 'info' },

  setGlobalLoading: (v) => set({ globalLoading: v }),

  showToast: (message, type = 'info') => {
    set({ toast: { visible: true, message, type } })
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      set((s) => ({ toast: { ...s.toast, visible: false } }))
    }, 2000)
  },

  hideToast: () => set((s) => ({ toast: { ...s.toast, visible: false } })),
}))
