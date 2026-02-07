export const VISITOR_ID_HEADER = "X-Visitor-Id"

const VISITOR_STORAGE_KEY = "verly_widget_visitor_id"

export function getStoredVisitorId(): string | null {
    if (typeof window === "undefined") return null
    try {
        const v = window.localStorage.getItem(VISITOR_STORAGE_KEY)
        const trimmed = (v || "").trim()
        return trimmed ? trimmed : null
    } catch {
        return null
    }
}

export function setStoredVisitorId(visitorId: string | null | undefined): void {
    if (typeof window === "undefined") return
    const v = (visitorId || "").trim()
    try {
        if (v) {
            window.localStorage.setItem(VISITOR_STORAGE_KEY, v)
        } else {
            window.localStorage.removeItem(VISITOR_STORAGE_KEY)
        }
    } catch {
        // ignore storage issues
    }
}

function keyForConversation(visitorId: string) {
    return `verly_widget_conversation_id:${visitorId}`
}

export function getStoredConversationId(): string | null {
    if (typeof window === "undefined") return null
    const visitorId = getStoredVisitorId()
    if (!visitorId) return null
    try {
        const v = window.localStorage.getItem(keyForConversation(visitorId))
        const trimmed = (v || "").trim()
        return trimmed ? trimmed : null
    } catch {
        return null
    }
}

export function setStoredConversationId(conversationId: string | null | undefined) {
    if (typeof window === "undefined") return
    const visitorId = getStoredVisitorId()
    if (!visitorId) return
    const v = (conversationId || "").trim()
    try {
        if (v) {
            window.localStorage.setItem(keyForConversation(visitorId), v)
        } else {
            window.localStorage.removeItem(keyForConversation(visitorId))
        }
    } catch {
        // ignore
    }
}
