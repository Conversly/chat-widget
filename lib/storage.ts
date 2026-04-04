export const CONTACT_ID_HEADER = "x-verly-contact-id"
export const CHATBOT_ID_HEADER = "x-verly-chatbot-id" // New header for backend validation

// Helper to generate namespaced keys
function getStorageKey(chatbotId: string, clientKey: string) {
    return `verly:${chatbotId}:${clientKey}`
}

const KEYS = {
    CONTACT_ID: "contactId",
    CONVERSATION_ID: "conversationId",
    LEAD: "lead", // New key for lead info
}

export function getStoredContactId(chatbotId: string): string | null {
    if (typeof window === "undefined" || !chatbotId) return null
    try {
        const key = getStorageKey(chatbotId, KEYS.CONTACT_ID)
        const v = window.localStorage.getItem(key)
        const trimmed = (v || "").trim()
        return trimmed ? trimmed : null
    } catch {
        return null
    }
}

export function setStoredContactId(chatbotId: string, contactId: string | null | undefined): void {
    if (typeof window === "undefined" || !chatbotId) return
    const key = getStorageKey(chatbotId, KEYS.CONTACT_ID)
    const v = (contactId || "").trim()
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

/**
 * Clear all identity-related localStorage for this chatbot.
 * Called on resetUser() to prevent stale contact/conversation IDs
 * from leaking to a different user on the same browser.
 */
export function clearStoredIdentity(chatbotId: string): void {
    if (typeof window === "undefined" || !chatbotId) return
    try {
        window.localStorage.removeItem(getStorageKey(chatbotId, KEYS.CONTACT_ID))
        window.localStorage.removeItem(getStorageKey(chatbotId, KEYS.CONVERSATION_ID))
    } catch {
        // ignore
    }
}

export function getStoredLeadGenerated(chatbotId: string): boolean {
    if (typeof window === "undefined" || !chatbotId) return false
    try {
        const key = `verly:lead_generated:${chatbotId}`
        return window.localStorage.getItem(key) === "true"
    } catch {
        return false
    }
}

export function setStoredLeadGenerated(chatbotId: string): void {
    if (typeof window === "undefined" || !chatbotId) return
    const key = `verly:lead_generated:${chatbotId}`
    try {
        window.localStorage.setItem(key, "true")
    } catch {
        // ignore
    }
}

export interface StoredLead {
    name: string
    email: string
    phone?: string
}

export function getStoredLead(chatbotId: string): StoredLead | null {
    if (typeof window === "undefined" || !chatbotId) return null
    try {
        const key = getStorageKey(chatbotId, KEYS.LEAD)
        const v = window.localStorage.getItem(key)
        if (!v) return null
        return JSON.parse(v) as StoredLead
    } catch {
        return null
    }
}

export function setStoredLead(chatbotId: string, lead: StoredLead): void {
    if (typeof window === "undefined" || !chatbotId) return
    const key = getStorageKey(chatbotId, KEYS.LEAD)
    try {
        window.localStorage.setItem(key, JSON.stringify(lead))
    } catch {
        // ignore
    }
}
