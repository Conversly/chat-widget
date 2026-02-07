"use client";

import { useEffect, useCallback } from "react";

type MessageHandler = {
    type: string;
    handler: (payload?: any) => void;
};

/**
 * Hook for iframe-host postMessage communication
 * 
 * Usage:
 * const { postToHost, isInIframe } = usePostMessage({
 *   handlers: [
 *     { type: 'open', handler: () => setIsOpen(true) },
 *     { type: 'close', handler: () => setIsOpen(false) },
 *   ]
 * });
 * 
 * // Send message to host
 * postToHost('widget:ready');
 */
export function usePostMessage(options?: { handlers?: MessageHandler[] }) {
    const handlers = options?.handlers || [];

    // Check if we're inside an iframe
    const isInIframe = typeof window !== "undefined" && window.parent !== window;

    // Send message to parent/host
    const postToHost = useCallback((type: string, payload?: any) => {
        if (typeof window === "undefined") return;

        const message = {
            source: "chat-widget",
            type,
            payload,
        };

        // If in iframe, post to parent
        if (window.parent !== window) {
            window.parent.postMessage(message, "*");
        }

        // Also dispatch custom event for same-origin usage
        window.dispatchEvent(new CustomEvent("chat-widget-message", { detail: message }));
    }, []);

    // Listen for messages from host
    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleMessage = (event: MessageEvent) => {
            const data = event.data;

            // Only handle messages from our host script
            // TODO: For strict production security, add: if (event.origin !== EXPECTED_ORIGIN) return;
            if (!data || typeof data !== "object" || data.source !== "chat-widget-host") {
                return;
            }

            console.log("[ChatWidget] Received message from host:", data.type);

            // Find and execute matching handler
            const handler = handlers.find((h) => h.type === data.type);
            if (handler) {
                handler.handler(data.payload);
            }
        };

        window.addEventListener("message", handleMessage);

        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, [handlers]);

    // Notify parent when widget is ready
    useEffect(() => {
        postToHost("widget:ready");
    }, [postToHost]);

    return { postToHost, isInIframe };
}
