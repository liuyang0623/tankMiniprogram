import { useAuditStore } from '../store/audit'

/** Returns audit mode status (never null - secure default used) */
export function useIsAuditMode(): boolean {
  return useAuditStore((s) => s.isAuditMode)
}

/** Returns admin status (loading state not represented - returns false until profile loads) */
export function useAdminCheck(): boolean {
  return useAuditStore((s) => s.isAdmin)
}
