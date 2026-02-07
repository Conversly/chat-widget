import { buildWsUrl, WS_URL } from "@/lib/api/config"
import {
  WidgetWsOutboundAction,
  type WidgetWsInboundMessage,
  type WidgetWsOutboundMessage,
  type WidgetWsOutboundUserMessage,
} from "@/types/activity"

export type WidgetWsConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error"

export type WidgetWebSocketClientEvents = {
  onConnectionStateChange?: (state: WidgetWsConnectionState) => void
  onMessage?: (msg: WidgetWsInboundMessage) => void
  onError?: (err: Error) => void
}

export class WidgetWebSocketClient {
  private socket: WebSocket | null = null
  private roomId: string | null = null
  private state: WidgetWsConnectionState = "disconnected"
  private retryTimer: ReturnType<typeof setTimeout> | null = null
  private allowReconnect = false
  private readonly url: string
  private readonly events: WidgetWebSocketClientEvents

  constructor(events: WidgetWebSocketClientEvents = {}, urlOverride?: string) {
    this.events = events
    const built = buildWsUrl("widget")
    this.url = urlOverride ?? (built || WS_URL)
  }

  getConnectionState(): WidgetWsConnectionState {
    return this.state
  }

  getRoomId(): string | null {
    return this.roomId
  }

  connect(): void {
    if (
      this.socket?.readyState === WebSocket.OPEN ||
      this.socket?.readyState === WebSocket.CONNECTING
    ) {
      return
    }

    this.clearRetry()
    this.allowReconnect = true
    this.setState("connecting")

    const socket = new WebSocket(this.url)
    this.socket = socket

    socket.onopen = () => {
      this.setState("connected")
      if (this.roomId) this.join(this.roomId)
    }

    socket.onclose = (event) => {
      this.socket = null
      this.setState("disconnected")

      // Auto-reconnect on unclean closes
      if (this.allowReconnect && !event.wasClean) {
        this.scheduleReconnect()
      }
    }

    socket.onerror = () => {
      this.setState("error")
      this.events.onError?.(new Error("WebSocket error"))
    }

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WidgetWsInboundMessage
        this.events.onMessage?.(msg)
      } catch (err) {
        const e = err instanceof Error ? err : new Error("Failed to parse WebSocket message")
        this.events.onError?.(e)
        this.setState("error")
      }
    }
  }

  disconnect(code = 1000, reason = "Normal closure"): void {
    this.clearRetry()
    this.allowReconnect = false
    this.roomId = null

    const socket = this.socket
    this.socket = null
    if (socket) {
      // Prevent any late events from scheduling reconnects.
      socket.onopen = null
      socket.onclose = null
      socket.onerror = null
      socket.onmessage = null

      // Close even if CONNECTING to abort handshake.
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close(code, reason)
      }
    }
    this.setState("disconnected")
  }

  join(roomId: string): void {
    this.roomId = roomId
    const msg: WidgetWsOutboundMessage = {
      action: WidgetWsOutboundAction.JOIN,
      room: roomId,
    }
    this.sendRaw(msg)
  }

  sendUserMessage(input: {
    roomId: string
    conversationId: string
    text: string
    messageId?: string
  }): void {
    const msg: WidgetWsOutboundUserMessage = {
      action: WidgetWsOutboundAction.MESSAGE,
      room: input.roomId,
      data: {
        conversationId: input.conversationId,
        senderType: "USER",
        text: input.text,
        messageId: input.messageId,
      },
    }
    this.sendRaw(msg)
  }

  private sendRaw(message: WidgetWsOutboundMessage): void {
    const socket = this.socket
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      // Best-effort: connect now; message won't be queued automatically.
      this.connect()
      this.events.onError?.(new Error("WebSocket not connected"))
      return
    }
    socket.send(JSON.stringify(message))
  }

  private setState(next: WidgetWsConnectionState): void {
    this.state = next
    this.events.onConnectionStateChange?.(next)
  }

  private scheduleReconnect(): void {
    this.clearRetry()
    this.retryTimer = setTimeout(() => {
      this.connect()
    }, 1000)
  }

  private clearRetry(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }
  }
}

