"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, X, MoreHorizontal, Maximize2, Minimize2, RefreshCw, VolumeX, Volume2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetConfig } from "@/types/chatbot";
import type { Conversation, Message } from "@/types/activity";
import {
    Conversation as ConversationContainer,
    ConversationContent,
    ConversationScrollButton,
    Message as MessageBubble,
    MessageContent,
    MessageResponse,
    MessageTimestamp,
} from "@/components/ai";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChatInput } from "./ChatInput";
import { MessageActions } from "./MessageActions";

import { LeadGenerationForm } from "./LeadGenerationForm";
import {
    PositiveFeedbackForm,
    NegativeFeedbackForm,
    type PositiveFeedbackData,
    type NegativeFeedbackData
} from "./FeedbackForm";
import { submitFeedback } from "@/lib/api/response";

export interface AssignedAgentInfo {
    displayName: string | null;
    avatarUrl: string | null;
}

import type { LeadForm } from "@/types/lead-forms";

interface ChatViewProps {
    config: WidgetConfig;
    conversation: Conversation;
    messages: Message[];
    onSendMessage: (content: string) => Promise<void>;
    onBack: () => void;
    onClose: () => void;
    onToggleMaximize?: () => void;
    isMaximized?: boolean;
    onNewChat?: () => void;
    onMute?: () => void;
    isMuted?: boolean;
    status?: "ready" | "submitted" | "streaming" | "error";
    /** Agent identity from WS STATE_UPDATE, used for role:"agent" messages. */
    assignedAgent?: AssignedAgentInfo;
    onRegenerate?: (messageId: string) => void;
    onFeedback?: (messageId: string, type: "positive" | "negative") => void;
    showLeadForm?: boolean;
    leadForm?: LeadForm | null;
    onLeadSubmit?: (data: Record<string, any>) => Promise<void>;
    onLeadDismiss?: () => void;
}

export function ChatView({
    config,
    conversation,
    messages,
    onClose,
    onBack,
    onSendMessage,
    onToggleMaximize,
    isMaximized,
    onNewChat,
    onMute,
    isMuted,
    status = "ready",
    assignedAgent,
    onRegenerate,
    onFeedback,
    showLeadForm,
    leadForm,
    onLeadSubmit,
    onLeadDismiss,
}: ChatViewProps) {
    const [input, setInput] = useState("");
    const [showNotice, setShowNotice] = useState(true);
    const [revealedMessageIds, setRevealedMessageIds] = useState<Set<string>>(new Set());
    const [feedbackState, setFeedbackState] = useState<{ messageId: string; type: "positive" | "negative" } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when feedback form appears
    useEffect(() => {
        if (feedbackState) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
            }, 100);
        }
    }, [feedbackState]);

    // Toggle message time visibility
    const toggleMessageTime = (messageId: string) => {
        const newSet = new Set(revealedMessageIds);
        if (newSet.has(messageId)) {
            newSet.delete(messageId);
        } else {
            newSet.add(messageId);
        }
        setRevealedMessageIds(newSet);
    };

    // Handle submit
    const handleSubmit = (text: string) => {
        if (text.trim()) {
            onSendMessage(text.trim());
            setInput("");
        }
    };

    const handleFeedbackSubmit = async (data: PositiveFeedbackData | NegativeFeedbackData) => {
        if (!feedbackState) return;

        try {
            let comment = "";
            if ("incorrect" in data) {
                // Negative feedback
                const parts = [];
                if (data.issue) parts.push(`Issue: ${data.issue}`);
                if (data.incorrect) parts.push("Incorrect information");
                if (data.irrelevant) parts.push("Irrelevant response");
                if (data.unaddressed) parts.push("Question not fully addressed");
                comment = parts.join(", ");
            } else {
                // Positive feedback
                comment = data.issue;
            }

            await submitFeedback(feedbackState.messageId, feedbackState.type, comment);
            setFeedbackState(null);
        } catch (error) {
            console.error("Failed to submit feedback", error);
        }
    };

    // Format date separator
    const formatDateSeparator = (date: Date): string => {
        const now = new Date();
        const diffDays = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        return date.toLocaleDateString([], { month: "long", day: "numeric" });
    };

    // Group messages by date
    const groupedMessages: { date: Date; messages: Message[] }[] = [];
    let currentDate: string | null = null;

    messages.forEach((msg) => {
        const timestamp = msg.timestamp || new Date();
        const dateStr = timestamp.toDateString();
        if (dateStr !== currentDate) {
            currentDate = dateStr;
            groupedMessages.push({ date: timestamp, messages: [msg] });
        } else {
            groupedMessages[groupedMessages.length - 1].messages.push(msg);
        }
    });

    // Get suggested messages from config (show only when no user messages yet)
    const hasUserMessages = messages.some((m) => m.role === "user");
    const showSuggestions = !hasUserMessages && config.suggestedMessages?.length;

    // Download chat history as JSON file
    const handleDownloadChat = () => {
        const chatData = {
            exportedAt: new Date().toISOString(),
            chatbotName: config.brandName || "Chatbot",
            messages: messages.map((msg) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                createdAt: msg.timestamp?.toISOString(),
            })),
        };

        const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `chat-export-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="h-full flex flex-col bg-white">


            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="flex items-center gap-2">
                        {/* Agent avatar */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br bg-white flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                            {config.brandLogo ? (
                                <img
                                    src={config.brandLogo}
                                    alt={conversation.agent.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                conversation.agent.name.charAt(0)
                            )}
                        </div>
                        <div>
                            <div className="font-semibold text-gray-900 text-sm">
                                {conversation.agent.name}
                            </div>

                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors outline-none"
                                title="More options"
                            >
                                <MoreHorizontal className="w-5 h-5 text-gray-600" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-white text-gray-900 border border-gray-200 shadow-lg">
                            {onToggleMaximize && (
                                <DropdownMenuItem onClick={onToggleMaximize}>
                                    {isMaximized ? (
                                        <>
                                            <Minimize2 className="mr-2 h-4 w-4" />
                                            <span>Minimize</span>
                                        </>
                                    ) : (
                                        <>
                                            <Maximize2 className="mr-2 h-4 w-4" />
                                            <span>Maximize</span>
                                        </>
                                    )}
                                </DropdownMenuItem>
                            )}
                            {onNewChat && (
                                <DropdownMenuItem onClick={onNewChat}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    <span>Start new chat</span>
                                </DropdownMenuItem>
                            )}
                            {onMute && (
                                <DropdownMenuItem onClick={onMute}>
                                    {isMuted ? (
                                        <>
                                            <Volume2 className="mr-2 h-4 w-4" />
                                            <span>Unmute sounds</span>
                                        </>
                                    ) : (
                                        <>
                                            <VolumeX className="mr-2 h-4 w-4" />
                                            <span>Mute sounds</span>
                                        </>
                                    )}
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleDownloadChat}>
                                <Download className="mr-2 h-4 w-4" />
                                <span>Download chat as JSON</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Close"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Dismissable Notice */}
            {config.dismissableNoticeText && showNotice && (
                <div className="bg-blue-50 px-4 py-2 flex items-start justify-between gap-2 border-b border-blue-100">
                    <p className="text-xs text-blue-700 leading-normal flex-1">
                        {config.dismissableNoticeText}
                    </p>
                    <button
                        onClick={() => setShowNotice(false)}
                        className="text-blue-400 hover:text-blue-700 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Messages Area - Using our new Conversation component */}
            <ConversationContainer
                className="flex-1 relative chat-scrollbar-container"
                messages={messages}
                scrollButton={<ConversationScrollButton />}
                style={{ '--chat-scrollbar-color': '#f3f4f6' } as React.CSSProperties}
            >
                <ConversationContent>
                    {groupedMessages.map((group, groupIndex) => (
                        <div key={groupIndex}>
                            {/* Date separator */}
                            <div className="flex items-center justify-center my-4">
                                <span className="text-xs text-gray-400 bg-white px-3">
                                    {formatDateSeparator(group.date)}
                                </span>
                            </div>

                            {/* Messages */}
                            {group.messages.map((msg) => {
                                const isAgent = msg.role === "agent";
                                const agentName = assignedAgent?.displayName || "Agent";
                                const agentAvatar = assignedAgent?.avatarUrl;

                                return (
                                    <div className="mb-3 group">
                                        {/* Agent identity label (only for agent messages) */}
                                        {isAgent && (
                                            <div className="flex items-center gap-2 px-4 mb-1">
                                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-medium overflow-hidden shrink-0">
                                                    {agentAvatar ? (
                                                        <img src={agentAvatar} alt={agentName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        agentName.charAt(0)
                                                    )}
                                                </div>
                                                <span className="text-xs font-medium text-gray-600">{agentName}</span>
                                            </div>
                                        )}

                                        <MessageBubble
                                            from={msg.role === "user" ? "user" : "assistant"}
                                            onBubbleClick={() => toggleMessageTime(msg.id)}
                                        >
                                            <MessageContent>
                                                {msg.role === "assistant" || isAgent ? (
                                                    msg.content ? (
                                                        <MessageResponse>{msg.content}</MessageResponse>
                                                    ) : (
                                                        <div className="flex gap-1 h-5 items-center px-1">
                                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                                        </div>
                                                    )
                                                ) : (
                                                    <span>{msg.content}</span>
                                                )}
                                            </MessageContent>
                                        </MessageBubble>
                                        {(msg.id === messages[messages.length - 1]?.id || revealedMessageIds.has(msg.id)) && (
                                            <div
                                                className={cn(
                                                    "mt-1 px-4",
                                                    msg.role === "user" ? "text-right" : "text-left"
                                                )}
                                            >
                                                <MessageTimestamp
                                                    date={msg.timestamp || new Date()}
                                                    format="time"
                                                />
                                            </div>
                                        )}

                                        {/* Actions for Assistant Messages */}
                                        {(msg.role === "assistant" || isAgent) && msg.content && (
                                            <div className="px-4 mb-2">
                                                <MessageActions
                                                    config={config}
                                                    content={msg.content}
                                                    isLast={msg.id === messages[messages.length - 1]?.id}
                                                    onRegenerate={() => {
                                                        onRegenerate?.(msg.id);
                                                    }}
                                                    onFeedback={(type) => {
                                                        setFeedbackState({ messageId: msg.id, type });
                                                        onFeedback?.(msg.id, type);
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    {/* Lead Generation Form as a Message Bubble */}
                    {showLeadForm && onLeadSubmit && onLeadDismiss && (
                        <div className="mb-3">
                            {/* Avatar */}
                            <div className="flex items-center gap-2 px-4 mb-1">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-medium overflow-hidden shrink-0">
                                    {(assignedAgent?.avatarUrl || config.botAvatar || config.widgetIcon) ? (
                                        <img
                                            src={assignedAgent?.avatarUrl || config.botAvatar || config.widgetIcon}
                                            alt={assignedAgent?.displayName || "Agent"}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        (assignedAgent?.displayName || "A").charAt(0)
                                    )}
                                </div>
                                <span className="text-xs font-medium text-gray-600">
                                    {assignedAgent?.displayName || "Assistant"}
                                </span>
                            </div>

                            <MessageBubble from="assistant">
                                <MessageContent>
                                    <LeadGenerationForm
                                        config={config}
                                        leadForm={leadForm || null}
                                        onSubmit={onLeadSubmit}
                                        onDismiss={onLeadDismiss}
                                    />
                                </MessageContent>
                            </MessageBubble>
                            <div className="mt-1 px-4 text-left">
                                <span className="text-[10px] text-gray-400">Just now</span>
                            </div>
                        </div>
                    )}

                    {/* Feedback Form */}
                    {feedbackState && (
                        <div className="mb-3">
                            <div className="flex items-center gap-2 px-4 mb-1">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-medium overflow-hidden shrink-0">
                                    {(assignedAgent?.avatarUrl || config.botAvatar || config.widgetIcon) ? (
                                        <img
                                            src={assignedAgent?.avatarUrl || config.botAvatar || config.widgetIcon}
                                            alt={assignedAgent?.displayName || "Agent"}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        (assignedAgent?.displayName || "A").charAt(0)
                                    )}
                                </div>
                                <span className="text-xs font-medium text-gray-600">
                                    {assignedAgent?.displayName || "Assistant"}
                                </span>
                            </div>

                            <MessageBubble from="assistant">
                                <MessageContent>
                                    {feedbackState.type === "positive" ? (
                                        <PositiveFeedbackForm
                                            config={config}
                                            onSubmit={handleFeedbackSubmit}
                                            onCancel={() => setFeedbackState(null)}
                                        />
                                    ) : (
                                        <NegativeFeedbackForm
                                            config={config}
                                            onSubmit={handleFeedbackSubmit}
                                            onCancel={() => setFeedbackState(null)}
                                        />
                                    )}
                                </MessageContent>
                            </MessageBubble>
                            <div className="mt-1 px-4 text-left">
                                <span className="text-[10px] text-gray-400">Just now</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </ConversationContent>
            </ConversationContainer>

            {/* Input Area */}
            <ChatInput
                config={config}
                input={input}
                setInput={setInput}
                handleSendMessage={handleSubmit}
                handleSuggestionClick={handleSubmit}
                hasUserMessages={hasUserMessages}
                disabled={status === "streaming"}
            />

            {/* Footer text if configured */}
            {
                config.footerText && (
                    <div className="px-4 pb-2 text-center">
                        <span className="text-xs text-gray-400">{config.footerText}</span>
                    </div>
                )
            }

        </div >
    );
}
