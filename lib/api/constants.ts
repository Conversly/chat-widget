// Widget-side WebSocket wire protocol types (socket server contract)
// NOTE: TS `enum` is forbidden with erasableSyntaxOnly; use const unions instead.

export const WidgetWsOutboundAction = {
    JOIN: "join",
    MESSAGE: "message",
} as const

export type WidgetWsOutboundAction =
    (typeof WidgetWsOutboundAction)[keyof typeof WidgetWsOutboundAction]

export const WidgetWsInboundEventType = {
    STATE_UPDATE: "STATE_UPDATE",
    CHAT_MESSAGE: "CHAT_MESSAGE",
    ERROR: "ERROR",
} as const

export type WidgetWsInboundEventType =
    (typeof WidgetWsInboundEventType)[keyof typeof WidgetWsInboundEventType]
