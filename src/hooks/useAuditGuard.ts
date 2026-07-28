import { useStore } from 'zustand'
import { useAuditStore } from '../store/audit'
import { useAuthStore } from '../store/auth'

/**
 * Hook to check if audit mode is enabled
 * @returns boolean indicating whether audit mode is true, false otherwise, null when loading
 */
export function useIsAuditMode(): boolean | null {
  const auditStore = useAuditStore()
  return auditStore.isAuditMode
}

/**
 * Hook to check if user is an administrator
 * @returns boolean indicating whether the current user has admin privileges
 */
export function useAdminCheck(): boolean {
  const authStore = useAuthStore()
  // If user not loaded or not logged in, assume not admin
  if (!authStore.user) return false
  return !!authStore.user.isAdmin
}

/**
 * Hook to get both audit status and admin check together
 * Returns object with auditMode (boolean | null) and isAdmin (boolean)
 */
export function useAuditGuard() {
  const auditMode = useIsAuditMode()
  const isAdmin = useAdminCheck()
  return { auditMode, isAdmin }
}
