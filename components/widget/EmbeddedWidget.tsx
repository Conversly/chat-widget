"use client";

import { useState, useEffect } from "react";
import { ChatWidget } from "./ChatWidget";
import { getWidgetConfig } from "@/lib/api/chatbot";
import type { WidgetConfig } from "@/types/widget";

interface EmbeddedWidgetProps {
    chatbotId: string;
    testing?: boolean;
}

/**
 * EmbeddedWidget Adapter
 * - Fetches config from API using chatbotId
 * - Transforms backend config to WidgetConfig format
 * - Supports testing mode
 */
export function EmbeddedWidget({ chatbotId, testing = false }: EmbeddedWidgetProps) {
    const [config, setConfig] = useState<WidgetConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load config from API (or use default in testing mode)
    useEffect(() => {
        const loadConfig = async () => {
            try {
                // console.log("[ChatWidget] Loading config for chatbot ID:", chatbotId, "testing:", testing);
                setLoading(true);
                setError(null);

                // In testing mode, use a default config instead of API call
                if (testing) {
                    // console.log("[ChatWidget] Testing mode - using default config");
                    const defaultConfig: WidgetConfig = {
                        brandName: "Chat Demo",
                        primaryColor: "#2D5A27",
                        greeting: "How can we help?",
                        placeholder: "Message...",
                        appearance: "light",
                        position: "bottom-right",
                        enableNewsFeed: true,
                        showAgentAvatars: true,
                        agents: [{ id: "1", name: "Support Bot", status: "online" }],
                        newsFeedItems: [
                            { id: "1", title: "Welcome!", description: "This is a demo widget in testing mode." }
                        ],
                    };
                    setConfig(defaultConfig);
                    setLoading(false);
                    return;
                }

                const response = await getWidgetConfig(chatbotId);
                // console.log("[ChatWidget] Received config:", response);

                // Transform API response to WidgetConfig format
                const styles = response.partial.styles || {};
                const attention = response.partial.attention || {};

                const widgetConfig: WidgetConfig = {
                    // Branding
                    brandName: styles.displayName ?? "Chat",
                    brandLogo: styles.PrimaryIcon ?? undefined,
                    primaryColor: styles.primaryColor ?? "#2D5A27",
                    bubbleColor: styles.widgetBubbleColour ?? styles.primaryColor ?? "#2D5A27",
                    widgetIcon: styles.widgeticon ?? undefined,

                    // Content
                    greeting: response.partial.initialMessage ?? "How can we help?",
                    placeholder: styles.messagePlaceholder ?? "Message...",
                    footerText: styles.footerText ?? undefined,
                    dismissableNoticeText: styles.dismissableNoticeText ?? undefined,

                    // Appearance
                    appearance: styles.appearance ?? "light",
                    position: styles.alignChatButton === "left" ? "bottom-left" : "bottom-right",

                    // Size & Layout
                    chatWidth: styles.chatWidth ?? "380px",
                    chatHeight: styles.chatHeight ?? "580px",

                    // Button Options
                    showButtonText: styles.showButtonText ?? false,
                    buttonText: styles.buttonText ?? styles.widgetButtonText ?? "",

                    // Behavior
                    autoShowInitial: styles.autoShowInitial ?? false,
                    autoShowDelaySec: styles.autoShowDelaySec ?? 0,

                    // Features
                    enableNewsFeed: false,
                    enableVoice: response.partial.callEnabled ?? false,
                    showAgentAvatars: true,
                    collectUserFeedback: styles.collectUserFeedback ?? false,
                    regenerateMessages: styles.regenerateMessages ?? true,
                    continueSuggestedMessages: styles.continueShowingSuggestedMessages ?? false,

                    // Suggested Messages
                    suggestedMessages: response.partial.suggestedMessages ?? [],

                    // Attention (popup/sound)
                    messagePopupEnabled: attention.messagePopupEnabled ?? false,
                    popupSoundEnabled: attention.popupSoundEnabled ?? false,
                    popupSoundUrl: attention.soundUrl ?? undefined,

                    // Suggested messages as news feed items for now
                    newsFeedItems: [],

                    // Agents (placeholder - would come from API)
                    agents: [
                        { id: "1", name: styles.displayName ?? "Support", status: "online" }
                    ],

                    // API Credentials
                    converslyWebId: response.partial.converslyWebId ?? "",
                    uniqueClientId: response.partial.uniqueClientId ?? "",
                    testing: testing,
                };

                // console.log("[ChatWidget] Transformed config:", widgetConfig);
                setConfig(widgetConfig);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load widget configuration");
                console.error("[ChatWidget] Error loading config:", err);
            } finally {
                setLoading(false);
            }
        };

        loadConfig();
    }, [chatbotId, testing]);

    // Loading state - show spinner
    if (loading) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4" />
                <p className="text-sm text-gray-500">Loading widget...</p>
            </div>
        );
    }

    // Error state - show error message
    if (error || !config) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-white p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Widget Unavailable</h3>
                <p className="text-sm text-gray-500 mb-1">
                    {error || "Failed to load configuration"}
                </p>
                <p className="text-xs text-gray-400">
                    Chatbot ID: {chatbotId}
                </p>
            </div>
        );
    }

    return <ChatWidget config={config} />;
}

