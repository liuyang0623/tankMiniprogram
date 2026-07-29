import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest'
import { useAuditStore } from '../audit'

// Mock the APIs before tests
const mockAppConfigApi = {
  getAuditMode: vi.fn(),
}
const mockUsersApi = {
  getProfile: vi.fn(),
}

beforeAll(() => {
  // Replace imports with mocks using vitest's module mocking
  vi.mock('../services/api/appConfig', () => ({
    appConfigApi: mockAppConfigApi,
  }))
  vi.mock('../services/api/users', () => ({
    usersApi: mockUsersApi,
  }))
})

describe('useAuditStore', () => {
  beforeEach(() => {
    // Reset store state between tests - start with secure default (true)
    useAuditStore.setState({
      isAuditMode: true,
      isAdmin: false,
      load: async () => Promise.resolve(),
      setIsAuditMode: () => {},
      setIsAdmin: () => {},
      toggleAuditMode: async () => false,
    })

    // Clear mock calls
    mockAppConfigApi.getAuditMode.mockClear()
    mockUsersApi.getProfile.mockClear()
  })

  it('should initialize with secure default audit mode = true', () => {
    const store = useAuditStore.getState()
    expect(store.isAuditMode).toBe(true)
    expect(store.isAdmin).toBe(false)
  })

  it('should update audit mode when setIsAuditMode called', () => {
    const store = useAuditStore.getState()
    store.setIsAuditMode(false)
    expect(store.isAuditMode).toBe(false)
  })

  it('should update admin status when setIsAdmin called', () => {
    const store = useAuditStore.getState()
    store.setIsAdmin(true)
    expect(store.isAdmin).toBe(true)
  })

  it('load method should fetch and override audit mode to false from API', async () => {
    // Arrange: mock API response - audit mode is false
    mockAppConfigApi.getAuditMode.mockResolvedValueOnce({ auditMode: false })

    // Use the real load function (not mocked in this test)
    // Re-bind the store to get the actual implementation
    const store = useAuditStore
    store.setState({ isAuditMode: true, isAdmin: false, load: store.load })

    // Act: call load
    await store.getState().load()

    // Assert: store gets false from API (overriding the secure default)
    expect(store.getState().isAuditMode).toBe(false)
  })

  it('load method should keep default true when API fails', async () => {
    // Arrange: mock API failure
    mockAppConfigApi.getAuditMode.mockRejectedValueOnce(new Error('Network error'))

    const store = useAuditStore
    store.setState({ isAuditMode: true, isAdmin: false, load: store.load })

    // Act: call load
    await store.getState().load()

    // Assert: should keep default true when API fails
    expect(store.getState().isAuditMode).toBe(true)
  })

  it('load method should set isAdmin from user profile when token exists', async () => {
    // Arrange: mock token and profile
    vi.spyOn(Taro, 'getStorageSync').mockReturnValue('fake-token')
    mockUsersApi.getProfile.mockResolvedValueOnce({ userId: 1, isAdmin: true })

    const store = useAuditStore
    store.setState({ isAuditMode: true, isAdmin: false, load: store.load })

    // Act
    await store.getState().load()

    // Assert
    expect(store.getState().isAdmin).toBe(true)
    Taro.getStorageSync.mockRestore()
  })
})
