import { useCallback, useEffect, useMemo, useRef } from "react"
import type {
  Message,
  UIConfigInput,
  ChatbotResponseData,
} from "../types/config"
import { useChatStore, useChatStoreApi } from "../store/use-chat-store"
import { WidgetWebSocketClient } from "../store/widget-websocket-client"
import { WidgetWsInboundEventType, type WidgetWsInboundMessage } from "../types/websocket"
import { getChatHistory } from "@/lib/api/response"

export type SendMessageStreamCallbacks = {
  onMeta?: (event: { conversation_id?: string; message_id?: string; request_id?: string }) => void
  onDelta?: (delta: string, accumulated?: string) => void
  onControl?: (escalate: boolean, reason?: string) => void
  onCitations?: (citations: string[]) => void
  onError?: (error: string, message?: string) => void
}

export type SendMessageContext = {
  conversationId?: string | null
  signal?: AbortSignal
} & SendMessageStreamCallbacks

export interface UseChatControllerOptions {
  config: UIConfigInput
  /** Override localStorage key used to persist conversationId (optional). */
  storageKey?: string
  /**
   * Function to send a message and get a response.
   * This is injected by the adapter (Preview/Actual/Embedded).
   */
  sendMessage: (
    content: string,
    messages: Message[],
    ctx?: SendMessageContext,
  ) => Promise<ChatbotResponseData>
}

export interface UseChatControllerReturn {
  // State
  messages: Message[]
  input: string
  isTyping: boolean
  isOpen: boolean
  conversationId: string | null
  escalation: ChatbotResponseData["escalation"] | null
  conversationPhase: "BOT_ACTIVE" | "WAITING_FOR_AGENT" | "HUMAN_ACTIVE" | "CLOSED"

  // Setters
  setInput: (input: string) => void
  setIsOpen: (isOpen: boolean) => void
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void

  // Actions
  handleSendMessage: (content: string) => Promise<void>
  handleSuggestionClick: (suggestion: string) => void
  handleRegenerate: () => Promise<void>
  handleRefreshChat: () => void
  handleRating: (
    messageId: string,
    rating: "thumbs-up" | "thumbs-down",
    feedback?: {
      issue?: string
      incorrect?: boolean
      irrelevant?: boolean
      unaddressed?: boolean
    }
  ) => Promise<void>
}

/**
 * Core chat controller hook that manages message state and interactions.
 * This is framework-agnostic and can be used by different adapters.
 */
export function useChatController({
  config,
  storageKey: storageKeyOverride,
  sendMessage,
}: UseChatControllerOptions): UseChatControllerReturn {
  const store = useChatStoreApi()
  const wsClientRef = useRef<WidgetWebSocketClient | null>(null)
  const hydratedHistoryConvIdRef = useRef<string | null>(null)

  const messages = useChatStore((s) => s.messages)
  const input = useChatStore((s) => s.input)
  const isTyping = useChatStore((s) => s.isTyping)
  const isOpen = useChatStore((s) => s.isOpen)
  const conversationId = useChatStore((s) => s.conversationId)
  const escalation = useChatStore((s) => s.escalation)
  const conversationPhase = useChatStore((s) => s.conversationPhase)
  const widgetState = useChatStore((s) => s.widgetState)

  const setInput = useCallback((next: string) => store.getState().setInput(next), [store])
  const setIsOpen = useCallback((next: boolean) => store.getState().setIsOpen(next), [store])
  const setMessages = useCallback(
    (next: Message[] | ((prev: Message[]) => Message[])) => store.getState().setMessages(next),
    [store]
  )

  const storageKey = useMemo(() => {
    if (storageKeyOverride) return storageKeyOverride
    // Keep stable per end-user (uniqueClientId) + workspace (converslyWebId)
    // Note: chatbotId isn't available here (only in some adapters), so we key without it.
    const webId = config.converslyWebId || "unknown_web"
    const clientId = config.uniqueClientId || "unknown_client"
    return `conversly:convId:${webId}:${clientId}`
  }, [config.converslyWebId, config.uniqueClientId, storageKeyOverride])

  // Hydrate conversationId once (localStorage -> store)
  useEffect(() => {
    if (typeof window === "undefined") return
    if (store.getState().conversationId) return
    try {
      const saved = window.localStorage.getItem(storageKey)
      if (saved && saved.trim()) {
        store.getState().setConversationId(saved)
      }
    } catch {
      // ignore storage issues
    }
  }, [storageKey, store])

  // Persist conversationId changes (store -> localStorage)
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      if (conversationId) {
        window.localStorage.setItem(storageKey, conversationId)
      } else {
        window.localStorage.removeItem(storageKey)
      }
    } catch {
      // ignore storage issues
    }
  }, [conversationId, storageKey])

  // If we already have a conversationId (from localStorage), fetch its full transcript.
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!conversationId) return
    if (hydratedHistoryConvIdRef.current === conversationId) return

    const convId = conversationId
    hydratedHistoryConvIdRef.current = convId

    // If a user already started chatting, don't clobber local state.
    const current = store.getState().messages
    const hasRealChat =
      current.some((m) => m.role === "user") ||
      current.some((m) => m.role === "assistant" && m.id !== "initial-assistant")
    if (hasRealChat) return

    const fetchHistory = async () => {
      store.getState().setIsTyping(true)
      try {
        const history = await getChatHistory(
          {
            uniqueClientId: config.uniqueClientId || "unknown_client",
            converslyWebId: config.converslyWebId || "unknown_web",
          },
          { originUrl: window.location.href },
          convId,
          config.testing ?? false
        )

        // If user started a new chat (or conversationId changed) while this request was in flight,
        // don't apply stale history/meta that would resurrect the old conversation.
        if (store.getState().conversationId !== convId) return

        const mapped: Message[] = (history.messages || []).map((m: any) => {
          const createdAt = new Date(m.created_at)
          return {
            id: m.message_id,
            role: m.role,
            content: m.content,
            citations: m.citations,
            createdAt: Number.isNaN(createdAt.getTime()) ? new Date() : createdAt,
            responseId: m.role === "assistant" ? m.message_id : undefined,
          }
        })

        if (mapped.length > 0) {
          store.getState().setMessages(mapped)
        } else if (config.InitialMessage) {
          store.getState().setMessages([
            {
              id: "initial-assistant",
              role: "assistant" as const,
              content: config.InitialMessage || "",
              createdAt: new Date(),
            },
          ])
        } else {
          store.getState().setMessages([])
        }

        store.getState().applyResponseMeta(history)
      } catch (error) {
        const maybeErrorCode =
          (error as { error?: unknown })?.error ??
          (error as { code?: unknown })?.code ??
          (error as { response?: { data?: { error?: unknown } } })?.response?.data?.error

        if (maybeErrorCode === "invalid_conversation_id") {
          hydratedHistoryConvIdRef.current = null
          store.getState().resetChat({
            initialAssistantMessage: config.InitialMessage || undefined,
          })
          return
        }

        // Non-fatal: keep empty/initial state.
        console.error("Failed to fetch chat history:", error)
      } finally {
        store.getState().setIsTyping(false)
      }
    }

    void fetchHistory()
  }, [
    conversationId,
    config.InitialMessage,
    config.converslyWebId,
    config.testing,
    config.uniqueClientId,
    store,
  ])

  // Initialize with initial message from config (and update if it changes)
  useEffect(() => {
    if (config.InitialMessage) {
      store.getState().setMessages((prev) => {
        // If there's already an initial assistant message, update its content
        const hasInitialMessage = prev.some((m) => m.id === "initial-assistant")
        if (hasInitialMessage) {
          return prev.map((m) =>
            m.id === "initial-assistant"
              ? { ...m, content: config.InitialMessage || "" }
              : m
          )
        }
        // Otherwise, if no messages, add the initial message
        if (prev.length === 0) {
          return [
            {
              id: "initial-assistant",
              role: "assistant" as const,
              content: config.InitialMessage || "",
              createdAt: new Date(),
            },
          ]
        }
        return prev
      })
    }
  }, [config.InitialMessage, store])

  // Instantiate widget WS client once (handlers use store.getState() to avoid stale closures).
  useEffect(() => {
    if (wsClientRef.current) return

    wsClientRef.current = new WidgetWebSocketClient({
      onConnectionStateChange: (state) => {
        store.getState().setWsConnectionState(state)
      },
      onError: (err) => {
        store.getState().setWsError(err.message)
        store.getState().setWsConnectionState("error")
      },
      onMessage: (msg: WidgetWsInboundMessage) => {
        // Join command response
        if ("status" in msg && typeof (msg as any).status === "string") {
          const room = (msg as any).room
          if (typeof room === "string" && room.length > 0) {
            store.getState().setWsRoomId(room)
            if (store.getState().widgetState === "AI_ESCALATED") {
              store.getState().setWidgetState("HUMAN_SOCKET_CONNECTED")
            }
          }
          return
        }

        // Broadcast envelope
        if ("eventType" in msg && "data" in msg) {
          const eventType = (msg as any).eventType as string
          const data = (msg as any).data as any

          if (eventType === WidgetWsInboundEventType.STATE_UPDATE) {
            store.getState().onWsStateUpdate(data)
            return
          }

          if (eventType === WidgetWsInboundEventType.CHAT_MESSAGE) {
            store.getState().onWsChatMessage(data)
            return
          }

          if (eventType === WidgetWsInboundEventType.ERROR) {
            const message = typeof data?.message === "string" ? data.message : "WebSocket error"
            store.getState().setWsError(message)
            return
          }
        }
      },
    })
  }, [store])

  // Connect WS when escalated + conversationId is known. Disconnect when reset/closed.
  useEffect(() => {
    const client = wsClientRef.current
    if (!client) return

    const shouldConnect =
      !!conversationId && !!escalation && widgetState !== "CLOSED"

    if (!shouldConnect) {
      client.disconnect()
      store.getState().setWsRoomId(null)
      store.getState().setWsConnectionState("disconnected")
      return
    }

    const roomId = `conversation:${conversationId}`
    store.getState().setWsRoomId(roomId)
    client.join(roomId)
    client.connect()

    // If escalation happened but state wasn't updated (defensive), ensure AI_ESCALATED.
    if (store.getState().widgetState === "AI_ONLY") {
      store.getState().setWidgetState("AI_ESCALATED")
    }

    return () => {
      // keep connection if hook stays mounted; cleanup is handled on reset/close above
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, escalation, widgetState, store])

  const handleSendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed) return

      // If a human has taken over, route messages via WS only.
      if (store.getState().widgetState === "HUMAN_ACTIVE") {
        const convId = store.getState().conversationId
        if (!convId) return

        const userMessage: Message = {
          id: `user-${Date.now()}`,
          role: "user",
          content: trimmed,
          createdAt: new Date(),
        }

        const stateBefore = store.getState()
        stateBefore.setMessages([...stateBefore.messages, userMessage])
        stateBefore.setInput("")
        stateBefore.setIsTyping(false)

        const roomId = `conversation:${convId}`
        wsClientRef.current?.sendUserMessage({
          roomId,
          conversationId: convId,
          text: trimmed,
          messageId: userMessage.id,
        })

        return
      }

      // Add user message
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        createdAt: new Date(),
      }

      const stateBefore = store.getState()
      const updatedMessages = [...stateBefore.messages, userMessage]
      stateBefore.setMessages(updatedMessages)
      stateBefore.setInput("")
      stateBefore.setIsTyping(true)

      let placeholderId: string | null = null
      const ensurePlaceholder = () => {
        if (placeholderId) return placeholderId
        placeholderId = `assistant-stream-${Date.now()}`
        store.getState().appendMessage({
          id: placeholderId,
          role: "assistant",
          content: "",
          createdAt: new Date(),
          citations: [],
        })
        return placeholderId
      }

      try {
        // Call the injected sendMessage function (from adapter)
        const response = await sendMessage(trimmed, updatedMessages, {
          conversationId: store.getState().conversationId,
          onMeta: (event) => {
            if (event.conversation_id) {
              store.getState().setConversationId(event.conversation_id)
            }
          },
          onDelta: (delta) => {
            if (!delta) return
            const id = ensurePlaceholder()
            store.getState().setMessages((prev) =>
              prev.map((m) =>
                m.id === id ? { ...m, content: (m.content || "") + delta } : m,
              ),
            )
          },
          onCitations: (citations) => {
            const id = ensurePlaceholder()
            store.getState().setMessages((prev) =>
              prev.map((m) => (m.id === id ? { ...m, citations } : m)),
            )
          },
          onControl: (escalate, reason) => {
            if (!escalate) return
            // Best-effort: show waiting-for-agent state early (final response will overwrite meta).
            store.getState().applyResponseMeta({
              success: true,
              response: "",
              citations: [],
              escalation: { id: "pending", status: "PENDING", reason },
            })
          },
          onError: (error, message) => {
            console.error("Streaming error event:", error, message)
          },
        })

        // Convert response to message format
        const resolvedResponseId = response.responseId ?? response.message_id
        if (placeholderId) {
          store.getState().setMessages((prev) =>
            prev.map((m) =>
              m.id === placeholderId
                ? {
                  ...m,
                  // Keep stable UI id but attach the canonical responseId for feedback.
                  content: response.response,
                  citations: response.citations,
                  responseId: resolvedResponseId,
                }
                : m,
            ),
          )
        } else {
          store.getState().appendMessage({
            id: resolvedResponseId || `assistant-${Date.now()}`,
            role: "assistant",
            content: response.response,
            createdAt: new Date(),
            citations: response.citations,
            responseId: resolvedResponseId,
          })
        }
        store.getState().applyResponseMeta(response)
      } catch (error) {
        const maybeErrorCode =
          (error as { error?: unknown })?.error ??
          (error as { code?: unknown })?.code ??
          (error as { response?: { data?: { error?: unknown } } })?.response?.data?.error

        if (maybeErrorCode === "invalid_conversation_id") {
          // Hard reset (no retry): clear persisted id via state -> storage effect + reset chat
          store.getState().resetChat({
            initialAssistantMessage: config.InitialMessage || undefined,
          })
          return
        }

        console.error("Failed to get chatbot response:", error)

        // Remove placeholder if present (avoid leaving an empty assistant bubble).
        if (placeholderId) {
          store.getState().setMessages((prev) => prev.filter((m) => m.id !== placeholderId))
        }

        // Add error message
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          createdAt: new Date(),
        }
        store.getState().appendMessage(errorMessage)
      } finally {
        store.getState().setIsTyping(false)
      }
    },
    [config.InitialMessage, sendMessage, store]
  )

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      handleSendMessage(suggestion)
    },
    [handleSendMessage]
  )

  const handleRegenerate = useCallback(async () => {
    if (store.getState().widgetState === "HUMAN_ACTIVE") return

    const currentMessages = store.getState().messages
    const lastUserMessage = [...currentMessages].reverse().find((m) => m.role === "user")
    if (!lastUserMessage) return

    store.getState().setIsTyping(true)
    let placeholderId: string | null = null
    const ensurePlaceholder = () => {
      if (placeholderId) return placeholderId
      placeholderId = `assistant-stream-${Date.now()}`
      store.getState().appendMessage({
        id: placeholderId,
        role: "assistant",
        content: "",
        createdAt: new Date(),
        citations: [],
      })
      return placeholderId
    }

    try {
      // Resend the last user message
      const response = await sendMessage(lastUserMessage.content, currentMessages, {
        conversationId: store.getState().conversationId,
        onMeta: (event) => {
          if (event.conversation_id) {
            store.getState().setConversationId(event.conversation_id)
          }
        },
        onDelta: (delta) => {
          if (!delta) return
          const id = ensurePlaceholder()
          store.getState().setMessages((prev) =>
            prev.map((m) =>
              m.id === id ? { ...m, content: (m.content || "") + delta } : m,
            ),
          )
        },
        onCitations: (citations) => {
          const id = ensurePlaceholder()
          store.getState().setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, citations } : m)),
          )
        },
        onControl: (escalate, reason) => {
          if (!escalate) return
          store.getState().applyResponseMeta({
            success: true,
            response: "",
            citations: [],
            escalation: { id: "pending", status: "PENDING", reason },
          })
        },
        onError: (error, message) => {
          console.error("Streaming error event:", error, message)
        },
      })

      const resolvedResponseId = response.responseId ?? response.message_id
      if (placeholderId) {
        store.getState().setMessages((prev) =>
          prev.map((m) =>
            m.id === placeholderId
              ? {
                ...m,
                content: response.response,
                citations: response.citations,
                responseId: resolvedResponseId,
              }
              : m,
          ),
        )
      } else {
        store.getState().appendMessage({
          id: resolvedResponseId || `assistant-${Date.now()}`,
          role: "assistant",
          content: response.response,
          createdAt: new Date(),
          citations: response.citations,
          responseId: resolvedResponseId,
        })
      }
      store.getState().applyResponseMeta(response)
    } catch (error) {
      const maybeErrorCode =
        (error as { error?: unknown })?.error ??
        (error as { code?: unknown })?.code ??
        (error as { response?: { data?: { error?: unknown } } })?.response?.data?.error

      if (maybeErrorCode === "invalid_conversation_id") {
        store.getState().resetChat({
          initialAssistantMessage: config.InitialMessage || undefined,
        })
        return
      }
      console.error("Failed to regenerate response:", error)
      if (placeholderId) {
        store.getState().setMessages((prev) => prev.filter((m) => m.id !== placeholderId))
      }
    } finally {
      store.getState().setIsTyping(false)
    }
  }, [config.InitialMessage, sendMessage, store])

  const handleRating = useCallback(
    async (
      messageId: string,
      rating: "thumbs-up" | "thumbs-down",
      feedback?: {
        issue?: string
        incorrect?: boolean
        irrelevant?: boolean
        unaddressed?: boolean
      }
    ) => {
      // Find the message with this ID to get the responseId
      const message = store.getState().messages.find((m) => m.id === messageId)
      if (!message?.responseId) {
        console.warn("No responseId found for message", messageId)
        return
      }

      // This will be handled by the adapter's feedback submission logic
      console.log(`Message ${messageId} rated: ${rating}`, feedback)
    },
    [store]
  )

  const handleRefreshChat = useCallback(() => {
    wsClientRef.current?.disconnect()
    store.getState().resetChat({
      initialAssistantMessage: config.InitialMessage || undefined,
    })
  }, [config.InitialMessage, store])

  return {
    // State
    messages,
    input,
    isTyping,
    isOpen,
    conversationId,
    escalation,
    conversationPhase,

    // Setters
    setInput,
    setIsOpen,
    setMessages,

    // Actions
    handleSendMessage,
    handleSuggestionClick,
    handleRegenerate,
    handleRating,
    handleRefreshChat,
  }
}

