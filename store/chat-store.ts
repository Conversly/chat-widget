import { createStore } from "zustand/vanilla"
import type { StoreApi } from "zustand/vanilla"
import type { ChatbotResponseData } from "@/types/response"
import type { Message, WidgetWsChatMessagePayload, WidgetWsStateUpdatePayload, ConversationState } from "@/types/activity"

export type ConversationPhase =
  | "BOT_ACTIVE"
  | "WAITING_FOR_AGENT"
  | "HUMAN_ACTIVE"
  | "CLOSED"

// Widget-side state machine (source-of-truth for frontend behavior)
export type WidgetState =
  | "AI_ONLY"
  | "AI_ESCALATED"
  | "HUMAN_SOCKET_CONNECTED"
  | "HUMAN_ACTIVE"
  | "CLOSED"

export type WidgetWsConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error"

export type WidgetWsRuntime = {
  connectionState: WidgetWsConnectionState
  roomId: string | null
  lastError: string | null
}

export type Escalation = NonNullable<ChatbotResponseData["escalation"]>

function widgetStateToConversationPhase(state: WidgetState): ConversationPhase {
  switch (state) {
    case "AI_ONLY":
      return "BOT_ACTIVE"
    case "AI_ESCALATED":
      return "WAITING_FOR_AGENT"
    case "HUMAN_SOCKET_CONNECTED":
      return "WAITING_FOR_AGENT"
    case "HUMAN_ACTIVE":
      return "HUMAN_ACTIVE"
    case "CLOSED":
      return "CLOSED"
  }
}

export type IdentityState =
  | "unidentified"
  | "pending"
  | "verified"
  | "failed"
  | "expired"

export interface ChatStoreState {
  // Core chat state
  messages: Message[]
  input: string
  isTyping: boolean
  isOpen: boolean

  // Escalation / conversation identity
  conversationId: string | null
  escalation: ChatbotResponseData["escalation"] | null
  conversationState: ConversationState | null
  conversationPhase: ConversationPhase

  // Identity verification (JWT-based)
  identityToken: string | null
  identityPublicMeta: Record<string, string> | null
  identityState: IdentityState

  // Widget state machine + WS runtime (widget-only)
  widgetState: WidgetState
  ws: WidgetWsRuntime
  assignedAgentUserId: string | null
  assignedAgentDisplayName: string | null
  assignedAgentAvatarUrl: string | null

  // Online agent presence (from WS STATE_UPDATE)
  onlineAgents: number | null
  /** Whether user has submitted the "no agents online" contact form */
  noAgentsFormSubmitted: boolean
  /** Whether to show the "no agents online" form */
  showNoAgentsForm: boolean
}

export interface ChatStoreActions {
  setInput: (input: string) => void
  setIsOpen: (isOpen: boolean) => void
  setIsTyping: (isTyping: boolean) => void
  setConversationId: (conversationId: string | null) => void
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
  appendMessage: (message: Message) => void

  setWidgetState: (next: WidgetState) => void
  setWsConnectionState: (state: WidgetWsConnectionState) => void
  setWsRoomId: (roomId: string | null) => void
  setWsError: (error: string | null) => void
  onWsStateUpdate: (payload: WidgetWsStateUpdatePayload) => void
  onWsChatMessage: (payload: WidgetWsChatMessagePayload) => void
  closeConversation: () => void

  applyResponseMeta: (res: ChatbotResponseData) => void
  resetChat: (opts?: { initialAssistantMessage?: string }) => void

  // No agents online form actions
  setOnlineAgents: (count: number | null) => void
  setNoAgentsFormSubmitted: (submitted: boolean) => void
  setShowNoAgentsForm: (show: boolean) => void
  submitNoAgentsForm: () => void
  dismissNoAgentsForm: () => void

  // Identity verification actions
  setIdentity: (token: string, publicMeta: Record<string, string>) => void
  clearIdentity: () => void
  setIdentityState: (state: IdentityState) => void
}

export type ChatStore = ChatStoreState & ChatStoreActions
export type ChatStoreApi = StoreApi<ChatStore>

export interface CreateChatStoreOptions {
  initialOpen?: boolean
  initialMessages?: Message[]
  initialAssistantMessage?: string
}

export function createChatStore({
  initialOpen = false,
  initialMessages = [],
  initialAssistantMessage,
}: CreateChatStoreOptions = {}): ChatStoreApi {
  const seededMessages =
    initialMessages.length > 0
      ? initialMessages
      : initialAssistantMessage
        ? [
          {
            id: "initial-assistant",
            role: "assistant" as const,
            content: initialAssistantMessage,
            createdAt: new Date(),
          },
        ]
        : []

  return createStore<ChatStore>()((set) => ({
    // State
    messages: seededMessages,
    input: "",
    isTyping: false,
    isOpen: initialOpen,

    conversationId: null,
    escalation: null,
    conversationState: null,
    conversationPhase: "BOT_ACTIVE",

    // Identity verification (not persisted to localStorage — starts fresh each page load)
    identityToken: null,
    identityPublicMeta: null,
    identityState: "unidentified",

    widgetState: "AI_ONLY",
    ws: { connectionState: "disconnected", roomId: null, lastError: null },
    assignedAgentUserId: null,
    assignedAgentDisplayName: null,
    assignedAgentAvatarUrl: null,

    // Online agent presence
    onlineAgents: null,
    noAgentsFormSubmitted: false,
    showNoAgentsForm: false,

    // Actions
    setInput: (input) => set({ input }),
    setIsOpen: (isOpen) => set({ isOpen }),
    setIsTyping: (isTyping) => set({ isTyping }),
    setConversationId: (conversationId) => set({ conversationId }),
    setMessages: (messages) =>
      set((state) => ({
        messages: typeof messages === "function" ? messages(state.messages) : messages,
      })),
    appendMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

    setWidgetState: (next) =>
      set(() => ({
        widgetState: next,
        conversationPhase: widgetStateToConversationPhase(next),
      })),

    setWsConnectionState: (state) =>
      set((prev) => ({
        ws: { ...prev.ws, connectionState: state },
      })),

    setWsRoomId: (roomId) =>
      set((prev) => ({
        ws: { ...prev.ws, roomId },
      })),

    setWsError: (error) =>
      set((prev) => ({
        ws: { ...prev.ws, lastError: error },
      })),

    onWsStateUpdate: (payload) => {
      set((state) => {
        const onlineAgents = payload.onlineAgents ?? null
        // Automatically show the "no agents online" form when:
        // - onlineAgents is 0 (no agents available)
        // - Escalation is in a waiting state (ESCALATED_UNASSIGNED)
        // - User hasn't already submitted or dismissed the form
        const shouldShowNoAgentsForm =
          onlineAgents === 0 &&
          payload.conversationState === "ESCALATED_UNASSIGNED" &&
          !state.noAgentsFormSubmitted &&
          !state.showNoAgentsForm

        return {
          conversationState: payload.conversationState as ConversationState,
          assignedAgentUserId: payload.assignedAgentUserId ?? null,
          assignedAgentDisplayName: payload.assignedAgentDisplayName ?? null,
          assignedAgentAvatarUrl: payload.assignedAgentAvatarUrl ?? null,
          onlineAgents,
          showNoAgentsForm: shouldShowNoAgentsForm ? true : state.showNoAgentsForm,
        }
      })
    },

    onWsChatMessage: (payload) => {
      // De-dupe: widget appends its own user messages locally.
      if (payload.senderType === "USER") return

      // Only treat AGENT messages as the takeover trigger.
      if (payload.senderType !== "AGENT") return

      set((state) => {
        const createdAt = payload.sentAtUnix
          ? new Date(payload.sentAtUnix * 1000)
          : new Date()

        const msg: Message = {
          id: payload.messageId ?? `agent-${Date.now()}`,
          role: "agent",
          content: payload.text,
          createdAt,
        }

        const nextWidgetState =
          state.widgetState === "HUMAN_ACTIVE" ? state.widgetState : "HUMAN_ACTIVE"

        return {
          messages: [...state.messages, msg],
          widgetState: nextWidgetState,
          conversationPhase: widgetStateToConversationPhase(nextWidgetState),
        }
      })
    },

    closeConversation: () =>
      set(() => ({
        widgetState: "CLOSED",
        conversationPhase: "CLOSED",
      })),

    applyResponseMeta: (res) => {
      set((state) => {
        const next: Partial<ChatStoreState> = {}

        if (res.conversation_id) {
          next.conversationId = res.conversation_id
        }

        // conversationState from the server is the authoritative source of truth.
        const serverConvState = res.conversationState ?? null
        if (serverConvState) {
          next.conversationState = serverConvState
        }

        // Conversation closed/resolved overrides everything else — no further messaging allowed
        if (
          res.conversation_status === "CLOSED" ||
          serverConvState === "CLOSED" ||
          serverConvState === "RESOLVED"
        ) {
          next.widgetState = "CLOSED"
          next.conversationPhase = "CLOSED"
          return next as Partial<ChatStore>
        }

        // Derive widget state from conversationState (primary) with escalation object as fallback.
        // This prevents spurious AI_ONLY downgrades when escalation object is temporarily null
        // (e.g. race between the streaming final event and a GetHistory re-fetch).
        // All states where the websocket is live / an agent is involved.
        const ESCALATED_SERVER_STATES = new Set<ConversationState>([
          "ESCALATED_UNASSIGNED",
          "ASSIGNED",
          "HUMAN_WAITING_USER",
          "USER_WAITING_HUMAN",
        ])
        const serverSaysEscalated = ESCALATED_SERVER_STATES.has(serverConvState as ConversationState)
        const isEscalated = serverSaysEscalated || !!res.escalation

        if (res.escalation) {
          next.escalation = res.escalation
        }

        if (isEscalated) {
          // Never downgrade once human has taken over.
          if (state.widgetState === "AI_ONLY") {
            next.widgetState = "AI_ESCALATED"
            next.conversationPhase = widgetStateToConversationPhase("AI_ESCALATED")
          }
          // ASSIGNED: an agent has claimed the conversation — advance to socket-connected.
          if (serverConvState === "ASSIGNED" && state.widgetState === "AI_ESCALATED") {
            next.widgetState = "HUMAN_SOCKET_CONNECTED"
            next.conversationPhase = widgetStateToConversationPhase("HUMAN_SOCKET_CONNECTED")
          }
          // Active back-and-forth states — promote to HUMAN_ACTIVE.
          if (
            serverConvState === "HUMAN_WAITING_USER" ||
            serverConvState === "USER_WAITING_HUMAN"
          ) {
            next.widgetState = "HUMAN_ACTIVE"
            next.conversationPhase = widgetStateToConversationPhase("HUMAN_ACTIVE")
          }
        } else {
          // Server says AI_ACTIVE and no escalation object — safe to return to bot state,
          // but never downgrade from an already-established human session.
          if (
            state.widgetState !== "HUMAN_ACTIVE" &&
            state.widgetState !== "HUMAN_SOCKET_CONNECTED" &&
            state.widgetState !== "AI_ESCALATED"
          ) {
            next.widgetState = "AI_ONLY"
            next.conversationPhase = widgetStateToConversationPhase("AI_ONLY")
          }
        }

        return next as Partial<ChatStore>
      })
    },

    // No agents online form actions
    setOnlineAgents: (count) => set({ onlineAgents: count }),
    setNoAgentsFormSubmitted: (submitted) => set({ noAgentsFormSubmitted: submitted }),
    setShowNoAgentsForm: (show) => set({ showNoAgentsForm: show }),
    submitNoAgentsForm: () => set({ noAgentsFormSubmitted: true, showNoAgentsForm: false }),
    dismissNoAgentsForm: () => set({ showNoAgentsForm: false }),

    // Identity verification actions
    setIdentity: (token, publicMeta) =>
      set({
        identityToken: token,
        identityPublicMeta: publicMeta,
        identityState: "pending", // pending until backend verifies on next message
      }),
    clearIdentity: () =>
      set({
        identityToken: null,
        identityPublicMeta: null,
        identityState: "unidentified",
      }),
    setIdentityState: (state) => set({ identityState: state }),

    resetChat: (opts) => {
      const initial = opts?.initialAssistantMessage
        ? [
          {
            id: "initial-assistant",
            role: "assistant" as const,
            content: opts.initialAssistantMessage,
            createdAt: new Date(),
          },
        ]
        : []

      set({
        messages: initial,
        input: "",
        isTyping: false,
        conversationId: null,
        escalation: null,
        conversationState: null,
        conversationPhase: "BOT_ACTIVE",
        identityToken: null,
        identityPublicMeta: null,
        identityState: "unidentified",
        widgetState: "AI_ONLY",
        ws: { connectionState: "disconnected", roomId: null, lastError: null },
        assignedAgentUserId: null,
        assignedAgentDisplayName: null,
        assignedAgentAvatarUrl: null,
        onlineAgents: null,
        noAgentsFormSubmitted: false,
        showNoAgentsForm: false,
      })
    },
  }))
}

