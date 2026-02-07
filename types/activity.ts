// Re-export canonical WS types from types/websocket.ts (single source of truth)
export {
    WidgetWsOutboundAction,
    WidgetWsInboundEventType,
} from "@/types/websocket"

export type {
    WidgetWsOutboundJoin,
    WidgetWsOutboundUserMessage,
    WidgetWsOutboundMessage,
    WidgetWsBroadcastEvent,
    WidgetWsStateUpdatePayload,
    WidgetWsChatMessagePayload,
    WidgetWsErrorPayload,
    WidgetWsCommandResponse,
    WidgetWsInboundMessage,
} from "@/types/websocket"

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
