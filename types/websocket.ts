// Widget-side WebSocket wire protocol types (socket server contract)
// NOTE: TS `enum` is forbidden with erasableSyntaxOnly; use const unions instead.

export const WidgetWsOutboundAction = {
  JOIN: "join",
  MESSAGE: "message",
} as const

export type WidgetWsOutboundAction =
  (typeof WidgetWsOutboundAction)[keyof typeof WidgetWsOutboundAction]

export type WidgetWsOutboundJoin = {
  action: typeof WidgetWsOutboundAction.JOIN;
  room: string;
};

export type WidgetWsOutboundUserMessage = {
  action: typeof WidgetWsOutboundAction.MESSAGE;
  room: string;
  data: {
    conversationId: string;
    senderType: "USER";
    text: string;
    messageId?: string;
  };
};

export type WidgetWsOutboundMessage = WidgetWsOutboundJoin | WidgetWsOutboundUserMessage;

export const WidgetWsInboundEventType = {
  STATE_UPDATE: "STATE_UPDATE",
  CHAT_MESSAGE: "CHAT_MESSAGE",
  ERROR: "ERROR",
} as const

export type WidgetWsInboundEventType =
  (typeof WidgetWsInboundEventType)[keyof typeof WidgetWsInboundEventType]

// Broadcast event envelope (server -> widget)
export type WidgetWsBroadcastEvent<T> = {
  roomId: string;
  eventType: WidgetWsInboundEventType | (string & {});
  data: T;
};

export type WidgetWsStateUpdatePayload = {
  conversationId: string;
  escalationId: string;
  status:
    | "REQUESTED"
    | "WAITING_FOR_AGENT"
    | "ASSIGNED"
    | "HUMAN_ACTIVE"
    | "RESOLVED"
    | "CANCELLED"
    | "TIMED_OUT"
    | (string & {});
  requestedAt?: string;
  reason?: string | null;
  assignedAgentUserId?: string | null;
  assignedAgentDisplayName?: string | null;
  assignedAgentAvatarUrl?: string | null;
};

export type WidgetWsChatMessagePayload = {
  conversationId: string;
  senderType: "USER" | "AGENT" | (string & {});
  text: string;
  messageId?: string;
  sentAtUnix?: number;
};

export type WidgetWsErrorPayload = { code?: string; message?: string };

// Command response frames (direct response to join/message)
export type WidgetWsCommandResponse = {
  status: string;
  room?: string;
  code?: string;
  message?: string;
  [key: string]: unknown;
};

export type WidgetWsInboundMessage =
  | WidgetWsCommandResponse
  | WidgetWsBroadcastEvent<WidgetWsStateUpdatePayload>
  | WidgetWsBroadcastEvent<WidgetWsChatMessagePayload>
  | WidgetWsBroadcastEvent<WidgetWsErrorPayload>
  | { error?: string; roomId?: string; room?: string; [key: string]: unknown };

