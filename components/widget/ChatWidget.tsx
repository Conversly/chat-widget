"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { WidgetConfig, WidgetView } from "@/types/chatbot";
import type { Conversation, Message, ChatMessage } from "@/types/activity";
import { HomeView } from "./HomeView";
import { MessagesView } from "./MessagesView";
import { ChatView } from "./ChatView";
import { usePostMessage } from "@/hooks/usePostMessage";
import { streamChatbotResponse } from "@/lib/api/response";
import { getChatHistory, listVisitorConversations } from "@/lib/api/activity";
import { useChat, type ChatStatus } from "@/hooks/use-chat";
import { getStoredVisitorId, getStoredConversationId, setStoredConversationId } from "@/lib/storage";

interface ChatWidgetProps {
    config: WidgetConfig;
    className?: string;
}

// Default demo config
const defaultConfig: WidgetConfig = {
    brandName: "Chat",
    primaryColor: "#2D5A27",
    greeting: "How can we help?",
    placeholder: "Message...",
    appearance: "light",
    position: "bottom-right",
    enableNewsFeed: true,
    showAgentAvatars: true,
    agents: [
        { id: "1", name: "Support", status: "online" },
    ],
    newsFeedItems: [],
};

export function ChatWidget({ config = defaultConfig, className }: ChatWidgetProps) {
    const [currentView, setCurrentView] = useState<WidgetView>("home");
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);

    // Use our new unified chat hook
    const {
        messages,
        status,
        setMessages,
        setStatus,
        addMessage,
        updateMessage,
        clearMessages,
    } = useChat();

    const isLeft = config.position === "bottom-left";

    // PostMessage handlers for iframe control from host
    const messageHandlers = useMemo(() => [
        {
            type: "close",
            handler: () => {
                setTimeout(() => {
                    setCurrentView("home");
                    setActiveConversation(null);
                }, 300);
            }
        },
    ], []);

    const { postToHost } = usePostMessage({ handlers: messageHandlers });

    // Send resize message to host when config changes
    useEffect(() => {
        if (config.chatWidth || config.chatHeight) {
            postToHost("widget:resize", {
                width: config.chatWidth,
                height: config.chatHeight
            });
        }
    }, [config.chatWidth, config.chatHeight, postToHost]);

    const handleCloseWidget = useCallback(() => {
        postToHost("widget:close");
        setTimeout(() => {
            setCurrentView("home");
            setActiveConversation(null);
        }, 300);
    }, [postToHost]);

    // State for UI interactions
    const [isMaximized, setIsMaximized] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    // Handlers
    const handleToggleMaximize = useCallback(() => {
        const newMaximized = !isMaximized;
        setIsMaximized(newMaximized);

        if (newMaximized) {
            postToHost("widget:resize", {
                width: "100%",
                height: "100%",
                maxWidth: "100vw",
                maxHeight: "100vh"
            });
        } else {
            postToHost("widget:resize", {
                width: "400px",
                height: "700px",
                maxWidth: "calc(100vw - 40px)",
                maxHeight: "calc(100vh - 120px)"
            });
        }
    }, [isMaximized, postToHost]);

    const handleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    const handleStartNewConversation = useCallback(() => {
        // Force response-service to create a fresh conversation.
        setStoredConversationId(null);
        const newConversation: Conversation = {
            id: Date.now().toString(),
            agent: {
                id: "1",
                name: config.botName || config.agents?.[0]?.name || "Support",
                status: "online",
                avatar: config.botAvatar || config.agents?.[0]?.avatar
            },
            lastMessage: "",
            lastMessageTime: new Date(),
            unreadCount: 0,
        };

        setActiveConversation(newConversation);
        clearMessages();

        // Add greeting if configured
        if (config.greeting) {
            addMessage({
                role: "assistant",
                content: config.greeting,
                status: "delivered",
            });
        }

        setCurrentView("chat");
    }, [config, clearMessages, addMessage]);

    const handleSelectConversation = useCallback(async (conversation: Conversation) => {
        setActiveConversation(conversation);
        clearMessages();

        setCurrentView("chat");
        setStatus("submitted");

        // Persist selection as "current" conversation.
        setStoredConversationId(conversation.id);

        try {
            const history = await getChatHistory(
                config.chatbotId || "",
                conversation.id,
                config.testing ?? false
            );

            const mapped = (history.messages || []).map((m) => ({
                id: m.message_id,
                role: m.role,
                content: m.content,
                createdAt: new Date(m.created_at),
                status: "delivered" as const,
            }));

            if (mapped.length > 0) {
                setMessages(mapped as any);
            } else if (config.greeting) {
                // If the conversation exists but has no stored messages yet, show greeting.
                setMessages([{
                    id: "initial-assistant",
                    role: "assistant",
                    content: config.greeting,
                    createdAt: new Date(),
                    status: "delivered" as const,
                }] as any);
            }
            setStatus("ready");
        } catch (e) {
            console.error("[ChatWidget] Failed to load history:", e);
            setStatus("ready");
        }
    }, [clearMessages, config.converslyWebId, config.greeting, config.testing, config.uniqueClientId, setMessages, setStatus]);

    const refreshConversations = useCallback(async () => {
        if (typeof window === "undefined") return;
        const visitorId = getStoredVisitorId();
        if (!visitorId) {
            setConversations([]);
            return;
        }

        try {
            const items = await listVisitorConversations(visitorId);
            const mapped: Conversation[] = items.map((c) => {
                const tsRaw = c.lastUserMessageAt || c.lastMessageAt || c.createdAt;
                const ts = new Date(tsRaw);
                return {
                    id: c.conversationId,
                    agent: {
                        id: "1",
                        name: config.botName || config.agents?.[0]?.name || "Support",
                        status: "online",
                        avatar: config.botAvatar || config.agents?.[0]?.avatar,
                    },
                    lastMessage: c.lastUserMessage || "",
                    lastMessageTime: Number.isNaN(ts.getTime()) ? new Date() : ts,
                    unreadCount: 0,
                };
            });
            setConversations(mapped);
        } catch (e) {
            console.error("[ChatWidget] Failed to load conversations:", e);
            setConversations([]);
        }
    }, [config.agents, config.botAvatar, config.botName]);

    // Load conversation list when user opens Messages view.
    useEffect(() => {
        if (currentView !== "messages") return;
        void refreshConversations();
    }, [currentView, refreshConversations]);

    const handleSendMessage = useCallback(async (content: string) => {
        // Add user message
        const userMessageId = addMessage({
            role: "user",
            content,
            status: "sent",
        });

        // Create placeholder for assistant response
        const assistantMessageId = addMessage({
            role: "assistant",
            content: "",
            status: "streaming",
        });

        // If no API credentials, use dummy response
        if (!config.converslyWebId || !config.uniqueClientId) {
            console.warn("[ChatWidget] No API credentials, using dummy response");
            setTimeout(() => {
                updateMessage(assistantMessageId, {
                    content: "Thanks for your message! This is a demo response. Configure API credentials for real responses.",
                    status: "delivered",
                });
                setStatus("ready");
            }, 1000);
            return;
        }

        setStatus("streaming");

        try {
            // Convert messages to backend format
            const allMessages = messages.concat({
                id: userMessageId,
                role: "user",
                content,
                createdAt: new Date(),
            });

            const chatMessages: ChatMessage[] = allMessages.map((m) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
            }));

            const requestBody = {
                query: JSON.stringify(chatMessages),
                mode: "default",
                user: {
                    uniqueClientId: config.uniqueClientId,
                    converslyWebId: config.converslyWebId,
                    metadata: {},
                },
                metadata: {
                    originUrl: typeof window !== "undefined" ? window.location.href : undefined,
                },
                conversationId: getStoredConversationId() || undefined,
            };

            await streamChatbotResponse(requestBody, {
                onMeta: (meta) => {
                    if (meta.conversation_id) {
                        const convId = meta.conversation_id;
                        setStoredConversationId(convId);
                        // If we were in a "new chat" placeholder, update the active conversation id.
                        setActiveConversation((prev) =>
                            prev ? { ...prev, id: convId } : prev
                        );
                    }
                },
                onDelta: (_delta, accumulated) => {
                    updateMessage(assistantMessageId, { content: accumulated });
                },
                onFinal: (response) => {
                    if (response.conversation_id) {
                        const convId = response.conversation_id;
                        setStoredConversationId(convId);
                        setActiveConversation((prev) =>
                            prev ? { ...prev, id: convId } : prev
                        );
                    }
                    updateMessage(assistantMessageId, {
                        content: response.response,
                        status: "delivered",
                    });
                    setStatus("ready");
                    void refreshConversations();
                },
                onError: (error) => {
                    console.error("[ChatWidget] Stream error:", error);
                    updateMessage(assistantMessageId, {
                        content: "Sorry, there was an error. Please try again.",
                        status: "error",
                    });
                    setStatus("error");
                },
            });
        } catch (error) {
            console.error("[ChatWidget] API error:", error);
            updateMessage(assistantMessageId, {
                content: "Sorry, there was an error connecting to the service.",
                status: "error",
            });
            setStatus("error");
        }
    }, [messages, config, addMessage, updateMessage, setStatus, refreshConversations]);

    const handleSuggestedMessageClick = useCallback((message: string) => {
        const newConversation: Conversation = {
            id: Date.now().toString(),
            agent: config.agents?.[0] || { id: "1", name: "Support", status: "online" },
            lastMessage: message,
            lastMessageTime: new Date(),
            unreadCount: 0,
        };
        setActiveConversation(newConversation);
        clearMessages();

        if (config.greeting) {
            addMessage({
                role: "assistant",
                content: config.greeting,
                status: "delivered",
            });
        }

        setCurrentView("chat");

        // Send the suggested message after a brief delay
        setTimeout(() => {
            handleSendMessage(message);
        }, 100);
    }, [config, handleSendMessage, clearMessages, addMessage]);

    const handleBackToMessages = () => {
        setCurrentView("messages");
        setActiveConversation(null);
    };

    // Convert our ChatMessage to the widget Message type
    const widgetMessages: Message[] = messages.map((m) => ({
        id: m.id,
        role: m.role as any, // Cast to any to avoid strict role mismatch if minor differences exist, or map correctly.
        content: m.content,
        createdAt: m.createdAt,
        timestamp: m.createdAt, // Compatibility
        status: m.status,
        agentId: activeConversation?.agent.id,
    }));

    return (
        <div className={cn(
            "h-full w-full flex flex-col overflow-hidden text-left antialiased relative",
            config.appearance === "dark" ? "bg-gray-900" : "bg-white",
        )}>
            {currentView === "home" && (
                <HomeView
                    config={config}
                    onClose={handleCloseWidget}
                    onStartConversation={handleStartNewConversation}
                    onViewMessages={() => setCurrentView("messages")}
                    onSuggestedMessageClick={handleSuggestedMessageClick}
                    conversations={conversations}
                />
            )}

            {currentView === "messages" && (
                <MessagesView
                    config={config}
                    conversations={conversations}
                    onClose={handleCloseWidget}
                    onSelectConversation={handleSelectConversation}
                    onStartNewConversation={handleStartNewConversation}
                    onGoHome={() => setCurrentView("home")}
                />
            )}

            {currentView === "chat" && activeConversation && (
                <ChatView
                    config={config}
                    conversation={activeConversation}
                    messages={widgetMessages}
                    onSendMessage={handleSendMessage}
                    onBack={handleBackToMessages}
                    onClose={() => {
                        window.parent.postMessage({ type: "widget:close" }, "*");
                    }}
                    onToggleMaximize={handleToggleMaximize}
                    isMaximized={isMaximized}
                    onNewChat={handleStartNewConversation}
                    onMute={handleMute}
                    isMuted={isMuted}
                />
            )}
        </div>
    );
}
