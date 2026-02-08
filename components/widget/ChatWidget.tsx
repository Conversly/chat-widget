"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { WidgetConfig, WidgetView } from "@/types/chatbot";
import type { Conversation, Message, ChatMessage as ApiChatMessage } from "@/types/activity";
import type { ChatbotResponseData } from "@/types/response";
import { HomeView } from "./HomeView";
import { MessagesView } from "./MessagesView";
import { ChatView } from "./ChatView";
import { usePostMessage } from "@/hooks/usePostMessage";
import { streamChatbotResponse, submitFeedback, streamPlaygroundResponse } from "@/lib/api/response";
import { getChatHistory, listVisitorConversations } from "@/lib/api/activity";
import { useChat, type ChatStatus, type ChatMessage as StateChatMessage } from "@/hooks/use-chat-state";
import { getStoredVisitorId, getStoredConversationId, setStoredConversationId, getStoredLeadGenerated, setStoredLeadGenerated } from "@/lib/storage";
import { WidgetWebSocketClient } from "@/store/widget-websocket-client";
import { WidgetWsInboundEventType, type WidgetWsInboundMessage } from "@/types/websocket";
import { SOUNDS } from "@/lib/config/sounds";
import { createLead } from "@/lib/api/leads";
import { MAXIMIZE_WIDTH_SCALE_FACTOR, MAXIMIZE_HEIGHT_SCALE_FACTOR } from "@/lib/constants";
import { useWidgetSound } from "@/hooks/use-widget-sound";

interface ChatWidgetProps {
    config: WidgetConfig;
    className?: string;
    defaultOpen?: boolean;
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
    popupSoundEnabled: true,
};

export function ChatWidget({ config = defaultConfig, className, defaultOpen = false }: ChatWidgetProps) {
    const [currentView, setCurrentView] = useState<WidgetView>("home");
    // Track if the widget is currently visible (open) in the parent page
    const [isWidgetOpen, setIsWidgetOpen] = useState(defaultOpen);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [escalation, setEscalation] = useState<ChatbotResponseData["escalation"] | null>(null);
    const [isHumanActive, setIsHumanActive] = useState(false);
    const [assignedAgent, setAssignedAgent] = useState<{ displayName: string | null; avatarUrl: string | null }>({
        displayName: null,
        avatarUrl: null,
    });
    const wsClientRef = useRef<WidgetWebSocketClient | null>(null);
    const wsRoomIdRef = useRef<string | null>(null);
    const [showLeadForm, setShowLeadForm] = useState(false);

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

    const shouldConnectWsForEscalationStatus = useCallback((status: unknown) => {
        if (typeof status !== "string") return false;
        return (
            status === "REQUESTED" ||
            status === "WAITING_FOR_AGENT" ||
            status === "ASSIGNED" ||
            status === "HUMAN_ACTIVE"
        );
    }, []);

    const shouldRouteMessagesToHuman = useCallback((status: unknown) => {
        return status === "HUMAN_ACTIVE";
    }, []);

    // Instantiate WS client once
    useEffect(() => {
        if (wsClientRef.current) return;

        wsClientRef.current = new WidgetWebSocketClient({
            onConnectionStateChange: (_state) => {
                // no-op for now (UI doesn't surface it yet)
            },
            onError: (err) => {
                console.warn("[ChatWidget] WebSocket error:", err);
            },
            onMessage: (msg: WidgetWsInboundMessage) => {
                // Join command response
                if ("status" in msg && typeof (msg as any).status === "string") {
                    const room = (msg as any).room;
                    if (typeof room === "string" && room.length > 0) {
                        wsRoomIdRef.current = room;
                    }
                    return;
                }

                // Broadcast envelope
                if ("eventType" in msg && "data" in msg) {
                    const eventType = (msg as any).eventType as string;
                    const data = (msg as any).data as any;

                    if (eventType === WidgetWsInboundEventType.STATE_UPDATE) {
                        // Informational: capture assigned agent identity for UI
                        setAssignedAgent({
                            displayName:
                                typeof data?.assignedAgentDisplayName === "string"
                                    ? data.assignedAgentDisplayName
                                    : null,
                            avatarUrl:
                                typeof data?.assignedAgentAvatarUrl === "string"
                                    ? data.assignedAgentAvatarUrl
                                    : null,
                        });

                        // If backend reports HUMAN_ACTIVE, route user messages via WS only.
                        if (shouldRouteMessagesToHuman(data?.status)) {
                            setIsHumanActive(true);
                        }
                        return;
                    }

                    if (eventType === WidgetWsInboundEventType.CHAT_MESSAGE) {
                        // Only AGENT messages trigger takeover + are displayed as role:"agent"
                        if (data?.senderType !== "AGENT") return;
                        const text = typeof data?.text === "string" ? data.text : "";
                        if (!text) return;

                        setIsHumanActive(true);
                        addMessage({
                            role: "agent",
                            content: text,
                            status: "delivered",
                        });
                        return;
                    }

                    if (eventType === WidgetWsInboundEventType.ERROR) {
                        console.warn("[ChatWidget] WS server error:", data);
                        return;
                    }
                }
            },
        });
    }, [addMessage]);

    // Connect WS whenever we have a conversationId + escalation (requested/active)
    useEffect(() => {
        const client = wsClientRef.current;
        if (!client) return;

        const convId = conversationId || getStoredConversationId(config.chatbotId || "");
        const shouldConnect = !!convId && !!escalation;

        if (!shouldConnect) {
            client.disconnect();
            wsRoomIdRef.current = null;
            return;
        }

        const roomId = `conversation:${convId}`;
        wsRoomIdRef.current = roomId;
        // Avoid the "join before open" transient error by connecting first.
        client.connect();
        client.join(roomId);
    }, [conversationId, escalation]);

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
        {
            type: "widget:opened",
            handler: () => {
                setIsWidgetOpen(true);
            }
        },
        {
            type: "widget:closed",
            handler: () => {
                setIsWidgetOpen(false);
            }
        }
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
        setIsWidgetOpen(false);
        setTimeout(() => {
            setCurrentView("home");
            setActiveConversation(null);
        }, 300);
    }, [postToHost]);

    // Auto-Show Logic
    useEffect(() => {
        if (!config.autoShowInitial) return;
        // Simple check: if we haven't shown it yet in this session (could use sessionStorage)
        // For now, just respect the config delay.
        const timer = setTimeout(() => {
            postToHost("widget:open");
        }, (config.autoShowDelaySec || 0) * 1000);

        return () => clearTimeout(timer);
    }, [config.autoShowInitial, config.autoShowDelaySec, postToHost]);

    // // Sound Logic
    // // Sound Logic
    // useWidgetSound({
    //     messages,
    //     isWidgetOpen,
    //     soundEnabled: config.popupSoundEnabled ?? false,
    //     soundUrl: config.popupSoundUrl,
    // });

    // Notification Logic (PostMessage only)
    const lastProcessedMessageId = useRef<string | null>(null);
    const lastProcessedMessageContent = useRef<string | null>(null);

    useEffect(() => {
        // Check if last message is from agent and is new (simple check via length or ID)
        const lastMsg = messages[messages.length - 1];
        if (!lastMsg) return;

        // Only act if it's an agent message and we are not the one who sent it
        if (lastMsg.role === "assistant" || lastMsg.role === "agent") {
            const isNewId = lastProcessedMessageId.current !== lastMsg.id;
            const isContentChanged = lastProcessedMessageContent.current !== lastMsg.content;

            // If widget is closed, notify parent to show popup
            // BUT only if something actually changed (ID or Content)
            if (!isWidgetOpen) {
                if (isNewId || isContentChanged) {
                    // NOTIFICATION: Update popup if content changed or it's a new message
                    postToHost("widget:notify", {
                        text: lastMsg.content || "New message"
                    });

                    // Update tracking refs to mark as processed/notified
                    lastProcessedMessageId.current = lastMsg.id;
                    lastProcessedMessageContent.current = lastMsg.content;
                }
            } else {
                // If widget is open, we consider the message "seen".
                // Update refs so that if user minimizes later, we don't popup this old message.
                lastProcessedMessageId.current = lastMsg.id;
                lastProcessedMessageContent.current = lastMsg.content;
            }
        }
    }, [messages, isWidgetOpen, postToHost]);


    // State for UI interactions
    const [isMaximized, setIsMaximized] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    // Handlers
    const handleToggleMaximize = useCallback(() => {
        const newMaximized = !isMaximized;
        setIsMaximized(newMaximized);

        if (newMaximized) {
            // Determine base width and height to multiply by MAXIMIZE_SCALE_FACTOR
            // Default base sizes: width 400px, height 700px
            const baseWidthStr = config.chatWidth || "400px";
            const baseHeightStr = config.chatHeight || "700px";

            // Parse numeric values (assuming px or number)
            const baseWidth = parseInt(baseWidthStr.toString().replace("px", ""), 10) || 400;
            const baseHeight = parseInt(baseHeightStr.toString().replace("px", ""), 10) || 700;

            const newWidth = Math.floor(baseWidth * MAXIMIZE_WIDTH_SCALE_FACTOR);
            const newHeight = Math.floor(baseHeight * MAXIMIZE_HEIGHT_SCALE_FACTOR);

            postToHost("widget:resize", {
                width: `${newWidth}px`,
                height: `${newHeight}px`,
                maxWidth: "100vw",
                maxHeight: "100vh"
            });
        } else {
            postToHost("widget:resize", {
                width: config.chatWidth || "400px",
                height: config.chatHeight || "700px",
                maxWidth: "calc(100vw - 40px)",
                maxHeight: "calc(100vh - 120px)"
            });
        }
    }, [isMaximized, postToHost, config.chatWidth, config.chatHeight]);

    const handleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    const handleStartNewConversation = useCallback(() => {
        // Force response-service to create a fresh conversation.
        setStoredConversationId(config.chatbotId || "", null);
        setConversationId(null);
        setEscalation(null);
        setIsHumanActive(false);
        wsClientRef.current?.disconnect();
        wsRoomIdRef.current = null;
        setAssignedAgent({ displayName: null, avatarUrl: null });
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
        setStoredConversationId(config.chatbotId || "", conversation.id);
        setConversationId(conversation.id);
        setIsHumanActive(false);
        setAssignedAgent({ displayName: null, avatarUrl: null });

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

            // If history indicates escalation is requested/active, connect WS immediately.
            const histEsc = (history as any)?.escalation;
            if (histEsc && shouldConnectWsForEscalationStatus(histEsc.status)) {
                setEscalation(histEsc);
                if (shouldRouteMessagesToHuman(histEsc.status)) {
                    setIsHumanActive(true);
                }
            } else {
                setEscalation(null);
            }
        } catch (e) {
            console.error("[ChatWidget] Failed to load history:", e);
            setStatus("ready");
        }
    }, [clearMessages, config.converslyWebId, config.greeting, config.testing, config.uniqueClientId, setMessages, setStatus]);

    const refreshConversations = useCallback(async () => {
        if (typeof window === "undefined") return;
        const visitorId = getStoredVisitorId(config.chatbotId || "");
        if (!visitorId) {
            setConversations([]);
            return;
        }

        try {
            const items = await listVisitorConversations(visitorId, config.chatbotId || "");
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

    // Common function to process chatbot response (used by sendMessage and regenerate)
    const processResponse = useCallback(async (history: StateChatMessage[]) => {
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
            const chatMessages: ApiChatMessage[] = history.map((m) => ({
                role: (m.role === "agent" ? "assistant" : m.role) as "user" | "assistant",
                content: m.content,
            }));

            if (config.isPlayground && config.playgroundOverrides) {
                // Use playground endpoint
                const requestBody = {
                    query: JSON.stringify(chatMessages),
                    mode: "default",
                    chatbot: {
                        chatbotId: config.playgroundOverrides.chatbotId || config.chatbotId || "",
                        chatbotSystemPrompt: config.playgroundOverrides.systemPrompt || "",
                        chatbotModel: config.playgroundOverrides.model || "gemini-2.0",
                        chatbotTemperature: config.playgroundOverrides.temperature || 0.7,
                    },
                    chatbotId: config.playgroundOverrides.chatbotId || config.chatbotId || "",
                    user: {
                        uniqueClientId: config.uniqueClientId,
                        converslyWebId: config.converslyWebId,
                        metadata: {},
                    },
                    metadata: {
                        originUrl: typeof window !== "undefined" ? window.location.href : undefined,
                    },
                    conversationId: getStoredConversationId(config.chatbotId || "") || undefined,
                };

                await streamPlaygroundResponse(requestBody, {
                    onMeta: (meta) => {
                        if (meta.conversation_id) {
                            const convId = meta.conversation_id;
                            setStoredConversationId(config.chatbotId || "", convId);
                            setConversationId(convId);
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
                            setStoredConversationId(config.chatbotId || "", convId);
                            setConversationId(convId);
                            setActiveConversation((prev) =>
                                prev ? { ...prev, id: convId } : prev
                            );
                        }

                        // Check for lead generation trigger
                        if (response.lead_generation) {
                            const alreadyGenerated = getStoredLeadGenerated(config.chatbotId || "");
                            if (!alreadyGenerated) {
                                setShowLeadForm(true);
                            }
                        }

                        updateMessage(assistantMessageId, {
                            content: response.response,
                            status: "delivered",
                        });
                        setStatus("ready");
                    },
                    onError: (error) => {
                        console.error("[ChatWidget] Playground Stream error:", error);
                        updateMessage(assistantMessageId, {
                            content: "Sorry, there was an error. Please try again.",
                            status: "error",
                        });
                        setStatus("error");
                    },
                });
            } else {
                // Use standard endpoint
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
                    conversationId: getStoredConversationId(config.chatbotId || "") || undefined,
                    chatbotId: config.chatbotId || "",
                };

                await streamChatbotResponse(requestBody, {
                    onMeta: (meta) => {
                        if (meta.conversation_id) {
                            const convId = meta.conversation_id;
                            setStoredConversationId(config.chatbotId || "", convId);
                            setConversationId(convId);
                            // If we were in a "new chat" placeholder, update the active conversation id.
                            setActiveConversation((prev) =>
                                prev ? { ...prev, id: convId } : prev
                            );
                        }
                    },
                    onControl: (escalate, reason) => {
                        // Early escalation hint: connect WS ASAP (final response is authoritative).
                        if (escalate) {
                            setEscalation({ id: "pending", status: "REQUESTED", reason });
                        }
                    },
                    onDelta: (_delta, accumulated) => {
                        updateMessage(assistantMessageId, { content: accumulated });
                    },
                    onFinal: (response) => {
                        if (response.conversation_id) {
                            const convId = response.conversation_id;
                            setStoredConversationId(config.chatbotId || "", convId);
                            setConversationId(convId);
                            setActiveConversation((prev) =>
                                prev ? { ...prev, id: convId } : prev
                            );
                        }

                        // Authoritative escalation flag
                        if (response.escalation && shouldConnectWsForEscalationStatus(response.escalation.status)) {
                            setEscalation(response.escalation);
                        } else if (response.escalation) {
                            // Escalation object exists but status isn't in the connect set; still treat as escalated.
                            setEscalation(response.escalation);
                        } else {
                            setEscalation(null);
                        }

                        // If backend says escalation is HUMAN_ACTIVE, stop routing to LLM from now on.
                        if (shouldRouteMessagesToHuman(response.escalation?.status)) {
                            setIsHumanActive(true);
                        }

                        // Check for lead generation trigger
                        if (response.lead_generation) {
                            const alreadyGenerated = getStoredLeadGenerated(config.chatbotId || "");
                            if (!alreadyGenerated) {
                                setShowLeadForm(true);
                            }
                        }

                        updateMessage(assistantMessageId, {
                            content: response.response,
                            status: "delivered",
                            responseId: response.responseId,
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
            }
        } catch (error) {
            console.error("[ChatWidget] API error:", error);
            updateMessage(assistantMessageId, {
                content: "Sorry, there was an error connecting to the service.",
                status: "error",
            });
            setStatus("error");
        }
    }, [config, addMessage, updateMessage, setStatus, refreshConversations, shouldConnectWsForEscalationStatus, shouldRouteMessagesToHuman]);

    const handleSendMessage = useCallback(async (content: string) => {
        // If a human has taken over, route messages via WS only.
        if (isHumanActive) {
            const convId = getStoredConversationId(config.chatbotId || "");
            const roomId = wsRoomIdRef.current || (convId ? `conversation:${convId}` : null);
            if (!convId || !roomId) return;

            const localId = addMessage({
                role: "user",
                content,
                status: "sent",
            });

            wsClientRef.current?.sendUserMessage({
                roomId,
                conversationId: convId,
                text: content,
                // let backend correlate if desired
                messageId: localId,
            });

            return;
        }

        // Add user message
        const userMessageId = addMessage({
            role: "user",
            content,
            status: "sent",
        });

        const newMessage: StateChatMessage = {
            id: userMessageId,
            role: "user",
            content,
            createdAt: new Date(),
            status: "sent",
        };

        // Process response with new history
        await processResponse([...messages, newMessage]);

    }, [messages, isHumanActive, addMessage, wsRoomIdRef, processResponse]);

    const handleRegenerate = useCallback(async (messageId: string) => {
        // Find message index
        const msgIndex = messages.findIndex(m => m.id === messageId);
        if (msgIndex === -1) return;

        // Find last user message
        const lastUserIndex = messages.map((m, i) => ({ ...m, origIndex: i }))
            .filter(m => m.role === "user")
            .pop()?.origIndex;

        if (lastUserIndex === undefined) return;

        // Truncate history to include the user message, removing subsequent assistant messages
        const newHistory = messages.slice(0, lastUserIndex + 1);

        // Update state
        setMessages(newHistory);

        // Re-process response
        await processResponse(newHistory);
    }, [messages, setMessages, processResponse]);

    const handleFeedback = useCallback(async (messageId: string, type: "positive" | "negative") => {
        const msg = messages.find(m => m.id === messageId);
        if (!msg?.responseId) {
            console.warn("Cannot submit feedback: No responseId for message", messageId);
            return;
        }

        try {
            await submitFeedback(msg.responseId, type);
            console.log("Feedback submitted:", type);
            // Optional: show toast or update UI state to show feedback was given
        } catch (e) {
            console.error("Failed to submit feedback:", e);
        }
    }, [messages]);

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

    const handleLeadSubmit = useCallback(async (data: { name: string; email: string; phone?: string }) => {
        try {
            const visitorId = getStoredVisitorId(config.chatbotId || "");
            const convId = conversationId || getStoredConversationId(config.chatbotId || "");

            if (!config.chatbotId || !convId) {
                console.error("Missing ID for lead submission");
                return;
            }

            await createLead({
                chatbotId: config.chatbotId,
                conversationId: convId,
                name: data.name,
                email: data.email,
                phoneNumber: data.phone || "",
                source: "WIDGET",
                visitorId: visitorId || "",
                // topicId can be inferred by backend or added if needed
            });

            setStoredLeadGenerated(config.chatbotId);
            setShowLeadForm(false);

            // Optional: Add a system message or toast
            // addMessage({ role: "system", content: "Thanks! We'll be in touch soon." });
        } catch (error) {
            console.error("Failed to submit lead:", error);
            throw error; // Re-throw to let form handle error state
        }
    }, [config.chatbotId, conversationId]);

    // Convert our ChatMessage to the widget Message type
    const widgetMessages: Message[] = messages.map((m) => ({
        id: m.id,
        role: m.role as any, // Cast to any to avoid strict role mismatch if minor differences exist, or map correctly.
        content: m.content,
        createdAt: m.createdAt,
        timestamp: m.createdAt, // Compatibility
        status: m.status,
        agentId: activeConversation?.agent.id,
        responseId: m.responseId,
    }));

    return (
        <div
            className={cn(
                "h-full w-full flex flex-col overflow-hidden text-left antialiased relative bg-white",
            )}
            style={{ backgroundColor: "white" }}
        >
            {currentView === "home" && (
                <HomeView
                    config={config}
                    onClose={handleCloseWidget}
                    onStartConversation={handleStartNewConversation}
                    onViewMessages={() => setCurrentView("messages")}
                    onSelectConversation={handleSelectConversation}
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
                    onClose={handleCloseWidget}
                    onToggleMaximize={handleToggleMaximize}
                    isMaximized={isMaximized}
                    onNewChat={handleStartNewConversation}
                    onMute={handleMute}
                    isMuted={isMuted}
                    status={status}
                    assignedAgent={assignedAgent}
                    onRegenerate={config.regenerateMessages ? handleRegenerate : undefined}
                    onFeedback={config.collectUserFeedback ? handleFeedback : undefined}
                    showLeadForm={showLeadForm}
                    onLeadSubmit={handleLeadSubmit}
                    onLeadDismiss={() => setShowLeadForm(false)}
                />
            )}
        </div>
    );
}
