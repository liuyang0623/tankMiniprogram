import { useAuditStore } from './audit'

describe('useAuditStore', () => {
  beforeEach(() => {
    // 重置 store
    useAuditStore.setState({
      isAuditMode: null,
      isAdmin: false,
      load: Promise.resolve(),
      setIsAuditMode: () => {},
      setIsAdmin: () => {},
      toggleAuditMode: async () => false,
    })
  })

  it('should initialize with correct state', () => {
    const store = useAuditStore.getState()
    expect(store.isAuditMode).toBeNull()
    expect(store.isAdmin).toBe(false)
  })

  it('should update audit mode when setIsAuditMode called', () => {
    const store = useAuditStore.getState()
    store.setIsAuditMode(true)
    expect(store.isAuditMode).toBe(true)
  })

  it('should update admin status when setIsAdmin called', () => {
    const store = useAuditStore.getState()
    store.setIsAdmin(true)
    expect(store.isAdmin).toBe(true)
  })
})
