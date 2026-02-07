import { WidgetWsOutboundAction, WidgetWsInboundEventType } from "@/lib/api/constants";

export { WidgetWsOutboundAction, WidgetWsInboundEventType };

export type ChatHistoryMessage = {
    message_id: string;
    role: "user" | "assistant";
    content: string;
    citations?: string[]; // Made optional to match config.ts usage
    created_at: string;
};

// UI Message representation
export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system' | 'agent';
    content: string;
    createdAt: Date;
    // Compatibility fields
    timestamp?: Date;
    status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error' | 'streaming';
    agentId?: string;

    // Extended fields
    citations?: string[];
    responseId?: string;
    source?: 'voice';
}

export interface Conversation {
    id: string;
    agent: {
        id: string;
        name: string;
        avatar?: string;
        status: 'online' | 'offline' | 'away';
        role?: string;
    };
    lastMessage: string;
    lastMessageTime: Date;
    unreadCount: number;
}


// Terminal / Analysis types
export type TerminalWidgetHistoryResponse = {
    success: boolean;
    data: {
        conversationId: string;
        conversationStatus?: string;
        escalation: { id: string; status: string; reason?: string | null } | null;
        messages: Array<{
            messageId: string;
            role: string;
            content: string;
            citations: string[];
            createdAt: string | Date;
        }>;
    };
};

export type TerminalVisitorConversationItem = {
    conversationId: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    lastMessageAt: string | null;
    lastUserMessage: string | null;
    lastUserMessageAt: string | null;
    closedAt: string | null;
    metadata: unknown;
};

export type TerminalVisitorConversationsPayload = {
    success: boolean;
    data: TerminalVisitorConversationItem[];
};

// WebSocket Types

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
    | { error?: string; roomId?: string; room?: string;[key: string]: unknown };
