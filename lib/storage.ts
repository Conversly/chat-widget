export const VISITOR_ID_HEADER = "x-verly-visitor-id"
export const CHATBOT_ID_HEADER = "x-verly-chatbot-id" // New header for backend validation

// Helper to generate namespaced keys
function getStorageKey(chatbotId: string, clientKey: string) {
    return `verly:${chatbotId}:${clientKey}`
}

const KEYS = {
    VISITOR_ID: "visitorId",
    CONVERSATION_ID: "conversationId",
}

export function getStoredVisitorId(chatbotId: string): string | null {
    if (typeof window === "undefined" || !chatbotId) return null
    try {
        const key = getStorageKey(chatbotId, KEYS.VISITOR_ID)
        const v = window.localStorage.getItem(key)
        const trimmed = (v || "").trim()
        return trimmed ? trimmed : null
    } catch {
        return null
    }
}

export function setStoredVisitorId(chatbotId: string, visitorId: string | null | undefined): void {
    if (typeof window === "undefined" || !chatbotId) return
    const key = getStorageKey(chatbotId, KEYS.VISITOR_ID)
    const v = (visitorId || "").trim()
    try {
        if (v) {
            window.localStorage.setItem(key, v)
        } else {
            window.localStorage.removeItem(key)
        }
    } catch {
        // ignore storage issues
    }
}

export function getStoredConversationId(chatbotId: string): string | null {
    if (typeof window === "undefined" || !chatbotId) return null
    // We don't strictly *need* visitorId to look up conversationId anymore with this scheme,
    // but typically a conversation is tied to a visitor.
    // However, the requested format is just "verly:<chatbotId>:<key>", so let's stick to that simple mapping.
    // If we wanted `verly:<chatbotId>:conversation_id:<visitorId>`, we could do that, but
    // the prompt asked for `verly:<chatbotId>:conversationCache` style.
    // Let's use `verly:<chatbotId>:conversationId` as the key.

    try {
        const key = getStorageKey(chatbotId, KEYS.CONVERSATION_ID)
        const v = window.localStorage.getItem(key)
        const trimmed = (v || "").trim()
        return trimmed ? trimmed : null
    } catch {
        return null
    }
}

export function setStoredConversationId(chatbotId: string, conversationId: string | null | undefined) {
    if (typeof window === "undefined" || !chatbotId) return
    const key = getStorageKey(chatbotId, KEYS.CONVERSATION_ID)
    const v = (conversationId || "").trim()
    try {
        if (v) {
            window.localStorage.setItem(key, v)
        } else {
            window.localStorage.removeItem(key)
        }
    } catch {
        // ignore
    }
}
