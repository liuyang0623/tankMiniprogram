import { create } from 'zustand'
import Taro from '@tarojs/taro'
import { BASE_URL } from '../config/env'
import { useAuthStore } from './auth'
import { useMessageStore } from './message'
import type { WsMessageEnvelope } from '../types/api'

interface WsState {
  connected: boolean
  /** 建立 WebSocket 连接（登录后调用） */
  connect: () => void
  /** 断开连接（登出时调用） */
  disconnect: () => void
}

let ws: Taro.SocketTask | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectAttempt = 0
const MAX_RECONNECT_DELAY = 30000 // 30s
const INITIAL_RECONNECT_DELAY = 1000 // 1s

function getWsUrl(): string {
  const token = useAuthStore.getState().token
  // Convert http(s) to ws(s)
  const wsBase = BASE_URL.replace(/^http/, 'ws').replace(/\/api\/v1\/?$/, '')
  return `${wsBase}/ws?token=${token}`
}

function scheduleReconnect(connect: () => void) {
  if (reconnectTimer) clearTimeout(reconnectTimer)
  const delay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempt), MAX_RECONNECT_DELAY)
  reconnectAttempt++
  reconnectTimer = setTimeout(() => {
    connect()
  }, delay)
}

function clearReconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  reconnectAttempt = 0
}

export const useWsStore = create<WsState>((set, get) => ({
  connected: false,

  connect: () => {
    // 关闭已有连接
    if (ws) {
      ws.close({})
      ws = null
    }

    const token = useAuthStore.getState().token
    if (!token) return

    // Taro.connectSocket 返回 Promise<SocketTask>，需 await 拿到任务实例
    Taro.connectSocket({ url: getWsUrl() })
      .then((task) => {
        ws = task

        task.onOpen(() => {
          set({ connected: true })
          clearReconnect()
        })

        task.onMessage((res) => {
          try {
            const envelope: WsMessageEnvelope = JSON.parse(res.data as string)
            if (envelope.type === 'new_message') {
              useMessageStore.getState().onNewMessage(envelope.data)
            }
          } catch {
            // 忽略非法消息
          }
        })

        task.onClose(() => {
          set({ connected: false })
          // 仍登录时才重连
          if (useAuthStore.getState().isLogin) {
            scheduleReconnect(get().connect)
          }
        })

        task.onError(() => {
          set({ connected: false })
        })
      })
      .catch(() => {
        set({ connected: false })
        if (useAuthStore.getState().isLogin) {
          scheduleReconnect(get().connect)
        }
      })
  },

  disconnect: () => {
    clearReconnect()
    if (ws) {
      ws.close({})
      ws = null
    }
    set({ connected: false })
  },
}))