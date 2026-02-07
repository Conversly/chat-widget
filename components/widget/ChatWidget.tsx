"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetConfig, WidgetView, Conversation, Message, Agent } from "@/types/widget";
import { HomeView } from "./HomeView";
import { MessagesView } from "./MessagesView";
import { ChatView } from "./ChatView";
import { usePostMessage } from "@/hooks/usePostMessage";
import { streamChatbotResponse } from "@/lib/api/response";
import type { ChatMessage, ChatbotResponseData } from "@/types/response";

interface ChatWidgetProps {
    config: WidgetConfig;
    className?: string;
}

// Default demo config matching Cal.com style
const defaultConfig: WidgetConfig = {
    brandName: "Cal.com",
    primaryColor: "#2D5A27",
    greeting: "How can we help?",
    placeholder: "Message...",
    appearance: "light",
    position: "bottom-right",
    enableNewsFeed: true,
    showAgentAvatars: true,
    agents: [
        { id: "1", name: "Jose", avatar: "/avatars/jose.jpg", status: "online", role: "Support" },
        { id: "2", name: "Sarah", avatar: "/avatars/sarah.jpg", status: "online", role: "Sales" },
        { id: "3", name: "Mike", avatar: "/avatars/mike.jpg", status: "away", role: "Tech" },
    ],
    newsFeedItems: [
        {
            id: "1",
            title: "Cal.com v5.6",
            description: "Cal.com v5.6 - Advanced private links, Round-robin groups, API V1 deprecation announcement, and more...",
            version: "v5.6",
        },
    ],
};

export function ChatWidget({ config = defaultConfig, className }: ChatWidgetProps) {
    const [currentView, setCurrentView] = useState<WidgetView>("home");
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([
        {
            id: "1",
            agent: config.agents?.[0] || { id: "1", name: "Jose", status: "online" },
            lastMessage: "You: thanks bye !!",
            lastMessageTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
            unreadCount: 0,
        },
    ]);

    const isLeft = config.position === "bottom-left";

    // PostMessage handlers for iframe control from host
    const messageHandlers = useMemo(() => [
        {
            type: "close", handler: () => {
                // When host says close, reset view after delay
                setTimeout(() => {
                    setCurrentView("home");
                    setActiveConversation(null);
                }, 300);
            }
        },
    ], []);

    const { postToHost, isInIframe } = usePostMessage({ handlers: messageHandlers });

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
        // Reset to home view when closing
        setTimeout(() => {
            setCurrentView("home");
            setActiveConversation(null);
        }, 300);
    }, [postToHost]);



    const handleStartNewConversation = () => {
        // Create a new conversation
        const newConversation: Conversation = {
            id: Date.now().toString(),
            agent: config.agents?.[0] || { id: "1", name: "Support", status: "online" },
            lastMessage: "",
            lastMessageTime: new Date(),
            unreadCount: 0,
        };
        setActiveConversation(newConversation);
        setMessages([]);
        setCurrentView("chat");
    };

    const handleSelectConversation = (conversation: Conversation) => {
        setActiveConversation(conversation);
        // Start with greeting from config - suggested questions will show in ChatView
        const initialMessages: Message[] = config.greeting
            ? [{
                id: "greeting",
                role: "assistant",
                content: config.greeting,
                timestamp: new Date(),
                agentId: conversation.agent.id,
            }]
            : [];
        setMessages(initialMessages);
        setCurrentView("chat");
    };

    const handleSendMessage = useCallback(async (content: string) => {
        // Add user message first
        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content,
            timestamp: new Date(),
            status: "sent",
        };
        setMessages((prev) => [...prev, userMessage]);

        // Create placeholder for assistant response
        const assistantMessageId = (Date.now() + 1).toString();
        const assistantMessage: Message = {
            id: assistantMessageId,
            role: "assistant",
            content: "",
            timestamp: new Date(),
            agentId: activeConversation?.agent.id,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // If no API credentials, use dummy response
        if (!config.converslyWebId || !config.uniqueClientId) {
            console.warn("[ChatWidget] No API credentials, using dummy response");
            setTimeout(() => {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantMessageId
                            ? { ...m, content: "Thanks for your message! This is a demo response. Configure API credentials for real responses." }
                            : m
                    )
                );
            }, 1000);
            return;
        }

        try {
            // Convert messages to backend format
            const chatMessages: ChatMessage[] = messages.concat(userMessage).map((m) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
            }));

            // Prepare request body
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
            };

            // Stream the response
            await streamChatbotResponse(requestBody, {
                onDelta: (delta, accumulated) => {
                    // Update assistant message with accumulated content
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantMessageId
                                ? { ...m, content: accumulated }
                                : m
                        )
                    );
                },
                onFinal: (response) => {
                    // Final update with complete response
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantMessageId
                                ? { ...m, content: response.response }
                                : m
                        )
                    );
                },
                onError: (error) => {
                    console.error("[ChatWidget] Stream error:", error);
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantMessageId
                                ? { ...m, content: "Sorry, there was an error. Please try again.", status: "error" }
                                : m
                        )
                    );
                },
            });
        } catch (error) {
            console.error("[ChatWidget] API error:", error);
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === assistantMessageId
                        ? { ...m, content: "Sorry, there was an error connecting to the service.", status: "error" }
                        : m
                )
            );
        }
    }, [messages, config, activeConversation]);

    const handleSuggestedMessageClick = useCallback((message: string) => {
        // Create a new conversation with the initial greeting
        const newConversation: Conversation = {
            id: Date.now().toString(),
            agent: config.agents?.[0] || { id: "1", name: "Support", status: "online" },
            lastMessage: message,
            lastMessageTime: new Date(),
            unreadCount: 0,
        };
        setActiveConversation(newConversation);

        // Add the initial greeting from config as first assistant message
        const initialMessages: Message[] = config.greeting
            ? [{
                id: "greeting",
                role: "assistant",
                content: config.greeting,
                timestamp: new Date(),
                agentId: newConversation.agent.id,
            }]
            : [];

        setMessages(initialMessages);
        setCurrentView("chat");

        // Send the suggested message after a brief delay
        setTimeout(() => {
            handleSendMessage(message);
        }, 100);
    }, [config, handleSendMessage]);

    const handleBackToMessages = () => {
        setCurrentView("messages");
        setActiveConversation(null);
    };

    return (
        <div className={cn(
            "h-full w-full flex flex-col overflow-hidden text-left antialiased relative",
            config.appearance === "dark" ? "bg-gray-900" : "bg-white",
            // If in iframe (hybrid mode), we don't need fixed positioning or shadows here as the container handles it
            // checking if isLeft logic is even needed anymore since iframe handles position
        )}>
            {/* Render current view */}
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
                    messages={messages}
                    onClose={handleCloseWidget}
                    onBack={handleBackToMessages}
                    onSendMessage={handleSendMessage}
                />
            )}
        </div>
    );
}
