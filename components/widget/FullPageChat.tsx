"use client";

import { useState, useRef, useEffect } from "react";
import { RefreshCw, Download, MoreHorizontal, ChevronRight } from "lucide-react";
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
    MessageCitations,
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
    type NegativeFeedbackData,
} from "./FeedbackForm";
import { submitFeedback } from "@/lib/api/response";
import type { AssignedAgentInfo } from "./ChatView";
import type { LeadForm } from "@/types/lead-forms";

interface FullPageChatProps {
    config: WidgetConfig;
    conversation: Conversation | null;
    messages: Message[];
    onSendMessage: (content: string) => Promise<void>;
    onNewChat: () => void;
    status?: "ready" | "submitted" | "streaming" | "error";
    assignedAgent?: AssignedAgentInfo;
    onRegenerate?: (messageId: string) => void;
    onFeedback?: (messageId: string, type: "positive" | "negative") => void;
    showLeadForm?: boolean;
    leadForm?: LeadForm | null;
    onLeadSubmit?: (data: Record<string, any>) => Promise<void>;
    onLeadDismiss?: () => void;
}

export function FullPageChat({
    config,
    conversation,
    messages,
    onSendMessage,
    onNewChat,
    status = "ready",
    assignedAgent,
    onRegenerate,
    onFeedback,
    showLeadForm,
    leadForm,
    onLeadSubmit,
    onLeadDismiss,
}: FullPageChatProps) {
    const [input, setInput] = useState("");
    const [revealedMessageIds, setRevealedMessageIds] = useState<Set<string>>(new Set());
    const [feedbackState, setFeedbackState] = useState<{ messageId: string; type: "positive" | "negative" } | null>(null);
    const [showNotice, setShowNotice] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Determine if we're in welcome mode (no user messages yet)
    const hasUserMessages = messages.some((m) => m.role === "user");
    const isWelcomeMode = !hasUserMessages;

    // Scroll to bottom when feedback form appears
    useEffect(() => {
        if (feedbackState) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
            }, 100);
        }
    }, [feedbackState]);

    const toggleMessageTime = (messageId: string) => {
        const newSet = new Set(revealedMessageIds);
        if (newSet.has(messageId)) {
            newSet.delete(messageId);
        } else {
            newSet.add(messageId);
        }
        setRevealedMessageIds(newSet);
    };

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
                const parts = [];
                if (data.issue) parts.push(`Issue: ${data.issue}`);
                if (data.incorrect) parts.push("Incorrect information");
                if (data.irrelevant) parts.push("Irrelevant response");
                if (data.unaddressed) parts.push("Question not fully addressed");
                comment = parts.join(", ");
            } else {
                comment = data.issue;
            }
            await submitFeedback(feedbackState.messageId, feedbackState.type, comment);
            setFeedbackState(null);
        } catch (error) {
            console.error("Failed to submit feedback", error);
        }
    };

    const formatDateSeparator = (date: Date): string => {
        const now = new Date();
        const diffDays = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        return date.toLocaleDateString([], { month: "long", day: "numeric" });
    };

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

    // ==================== WELCOME MODE ====================
    if (isWelcomeMode) {
        return (
            <div className="h-full flex flex-col bg-white">
                {/* Centered welcome content */}
                <div className="flex-1 flex flex-col items-center justify-center px-6">
                    {/* Bot avatar/logo */}
                    <div className="mb-6">
                        {config.brandLogo ? (
                            <img
                                src={config.brandLogo}
                                alt={config.brandName}
                                className="w-16 h-16 rounded-2xl object-cover shadow-sm"
                            />
                        ) : config.widgetIcon ? (
                            <img
                                src={config.widgetIcon}
                                alt={config.brandName}
                                className="w-16 h-16 rounded-2xl object-cover shadow-sm"
                            />
                        ) : (
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-sm"
                                style={{ backgroundColor: config.primaryColor }}
                            >
                                {(config.brandName || "V").charAt(0)}
                            </div>
                        )}
                    </div>

                    {/* Greeting */}
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2 text-center">
                        {config.greeting || "How can I help you today?"}
                    </h1>

                    {config.subGreeting && (
                        <p className="text-sm text-gray-500 mb-8 text-center max-w-md">
                            {config.subGreeting}
                        </p>
                    )}
                </div>

                {/* Input at bottom */}
                <div className="w-full max-w-3xl mx-auto px-4 pb-8">
                    <ChatInput
                        config={config}
                        input={input}
                        setInput={setInput}
                        handleSendMessage={handleSubmit}
                        handleSuggestionClick={handleSubmit}
                        hasUserMessages={false}
                        disabled={status === "streaming"}
                    />
                </div>
            </div>
        );
    }

    // ==================== CONVERSATION MODE ====================
    return (
        <div className="h-full flex flex-col bg-white">
            {/* Slim header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    {config.brandLogo ? (
                        <img
                            src={config.brandLogo}
                            alt={config.brandName}
                            className="w-7 h-7 rounded-lg object-cover"
                        />
                    ) : config.widgetIcon ? (
                        <img
                            src={config.widgetIcon}
                            alt={config.brandName}
                            className="w-7 h-7 rounded-lg object-cover"
                        />
                    ) : (
                        <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: config.primaryColor }}
                        >
                            {(config.brandName || "V").charAt(0)}
                        </div>
                    )}
                    <span className="font-semibold text-gray-900 text-sm">
                        {config.brandName || "Chat"}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={onNewChat}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        New Chat
                    </button>
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors outline-none"
                                title="More options"
                            >
                                <MoreHorizontal className="w-4 h-4 text-gray-500" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-white text-gray-900 border border-gray-200 shadow-lg">
                            <DropdownMenuItem onClick={handleDownloadChat}>
                                <Download className="mr-2 h-4 w-4" />
                                <span>Download chat</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
                        className="text-blue-400 hover:text-blue-700 transition-colors text-xs"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Messages */}
            <ConversationContainer
                className="flex-1 relative chat-scrollbar-container"
                messages={messages}
                scrollButton={<ConversationScrollButton />}
                style={{ '--chat-scrollbar-color': '#f3f4f6' } as React.CSSProperties}
            >
                <ConversationContent>
                    <div className="max-w-2xl mx-auto w-full">
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
                                        <div key={msg.id} className="mb-3 group">
                                            {/* Agent identity label */}
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
                                                    {/* Citations */}
                                                    {(msg.role === "assistant" || isAgent) && msg.citations && msg.citations.length > 0 && (
                                                        <MessageCitations citations={msg.citations} />
                                                    )}
                                                </MessageContent>
                                            </MessageBubble>

                                            {/* Footer: Timestamp + Actions */}
                                            <div className={cn(
                                                "px-4 mt-1 flex items-center gap-3 min-h-[24px]",
                                                msg.role === "user" ? "justify-end" : "justify-start"
                                            )}>
                                                {(msg.id === messages[messages.length - 1]?.id || revealedMessageIds.has(msg.id)) && (
                                                    <MessageTimestamp
                                                        date={msg.timestamp || new Date()}
                                                        format="time"
                                                    />
                                                )}

                                                {(msg.role === "assistant" || isAgent) && msg.content && (
                                                    <MessageActions
                                                        config={config}
                                                        content={msg.content}
                                                        isLast={msg.id === messages[messages.length - 1]?.id}
                                                        onRegenerate={() => onRegenerate?.(msg.id)}
                                                        onFeedback={(type) => {
                                                            setFeedbackState({ messageId: msg.id, type });
                                                            onFeedback?.(msg.id, type);
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}

                        {/* Lead Generation Form */}
                        {showLeadForm && onLeadSubmit && onLeadDismiss && (
                            <div className="mb-3">
                                <MessageBubble from="assistant" fullWidth={true}>
                                    <MessageContent>
                                        <LeadGenerationForm
                                            config={config}
                                            leadForm={leadForm || null}
                                            onSubmit={onLeadSubmit}
                                            onDismiss={onLeadDismiss}
                                        />
                                    </MessageContent>
                                </MessageBubble>
                            </div>
                        )}

                        {/* Feedback Form */}
                        {feedbackState && (
                            <div className="mb-3">
                                <MessageBubble from="assistant" fullWidth={true}>
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
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </ConversationContent>
            </ConversationContainer>

            {/* Input at bottom */}
            <div className="max-w-3xl mx-auto w-full px-4 pb-4">
                <ChatInput
                    config={config}
                    input={input}
                    setInput={setInput}
                    handleSendMessage={handleSubmit}
                    handleSuggestionClick={handleSubmit}
                    hasUserMessages={hasUserMessages}
                    disabled={status === "streaming"}
                />
            </div>

            {/* Powered by */}
            {(config.showPoweredBy !== false) && (
                <div className="pb-2 pt-0 flex justify-center">
                    <a
                        href="https://verlyai.xyz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity duration-200"
                    >
                        <img
                            src="/verly_logo_bw.png"
                            alt="Verlyai Logo"
                            className="w-6 h-6 object-contain grayscale"
                        />
                        <span className="text-[11px] font-medium text-gray-500 tracking-tight">
                            Powered by <span className="font-bold text-gray-900">Verlyai</span>
                        </span>
                    </a>
                </div>
            )}
        </div>
    );
}
