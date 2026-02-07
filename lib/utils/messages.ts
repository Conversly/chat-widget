import { Message, ChatMessage } from "@/types/activity";

export function convertBackendToUIMessage(msg: any): Message {
    const date = new Date(msg.created_at || Date.now());
    return {
        id: msg.id || Date.now().toString(),
        role: msg.role,
        content: msg.content,
        createdAt: date,
        timestamp: date,
    };
}

export function convertUIToBackendMessages(messages: Message[]): ChatMessage[] {
    return messages.map(m => ({
        role: (m.role === "agent" ? "assistant" : m.role) as "user" | "assistant" | "system",
        content: m.content
    }));
}

export function createUserMessage(content: string): Message {
    const date = new Date();
    return {
        id: Date.now().toString(),
        role: "user",
        content,
        createdAt: date,
        timestamp: date,
    };
}
