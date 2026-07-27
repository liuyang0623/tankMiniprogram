import { describe, it, expect, vi, beforeEach } from 'vitest'

// mock appConfigApi，隔离网络请求
const getMock = vi.fn()
vi.mock('../../services/api', () => ({
  appConfigApi: { get: () => getMock() },
}))

import { useAuditStore } from '../audit'

describe('auditStore', () => {
  beforeEach(() => {
    getMock.mockReset()
    useAuditStore.setState({ auditMode: false, loaded: false })
  })

  it('默认正常模式', () => {
    expect(useAuditStore.getState().auditMode).toBe(false)
    expect(useAuditStore.getState().loaded).toBe(false)
  })

  it('load 成功时写入 auditMode 并置 loaded', async () => {
    getMock.mockResolvedValue({ auditMode: true })
    await useAuditStore.getState().load()
    expect(useAuditStore.getState().auditMode).toBe(true)
    expect(useAuditStore.getState().loaded).toBe(true)
  })

  it('load 失败时降级为正常模式', async () => {
    getMock.mockRejectedValue(new Error('network'))
    await useAuditStore.getState().load()
    expect(useAuditStore.getState().auditMode).toBe(false)
    expect(useAuditStore.getState().loaded).toBe(true)
  })
})
