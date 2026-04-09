"use client";

import { useState, useRef, useEffect, JSX } from "react";
import { ChevronLeft, X, MoreHorizontal, Maximize2, Minimize2, RefreshCw, VolumeX, Volume2, Download, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetConfig } from "@/types/chatbot";
import type { Conversation, Message } from "@/types/activity";
import {
    Conversation as ConversationContainer,
    ConversationContent,
    ConversationScrollButton,
    Message as MessageBubble,
    MessageAvatar,
    MessageContent,
    MessageResponse,
    MessageTimestamp,
    MessageStatus,
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
import { LoadingMessages } from "./LoadingMessages";
import { TimelineMessage, DateSeparator, type TimelineEventType } from "./TimelineMessage";

import { LeadGenerationForm } from "./LeadGenerationForm";
import { NoAgentsForm } from "./NoAgentsForm";
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
import type { StoredLead } from "@/lib/storage";
import type { ConversationState } from "@/types/activity";

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
    showNoAgentsForm?: boolean;
    onNoAgentsFormSubmit?: (data: { name: string; email: string }) => Promise<void>;
    onNoAgentsFormDismiss?: () => void;
    storedLead?: StoredLead | null;
    /** Conversation state to determine if input should be disabled */
    conversationState?: ConversationState | null;
}

/**
 * Determine if a message is a timeline/system event
 */
function isTimelineMessage(message: Message): boolean {
    return message.role === "system";
}

/**
 * Parse a system message to determine its timeline type
 */
function getTimelineEventType(content: string): TimelineEventType {
    const lower = content.toLowerCase();
    if (lower.includes("chat started") || lower.includes("conversation started")) return "chat_start";
    if (lower.includes("joined") && lower.includes("chat")) return "agent_joined";
    if (lower.includes("left") && lower.includes("chat")) return "agent_left";
    if (lower.includes("chat ended") || lower.includes("conversation ended")) return "chat_ended";
    if (lower.includes("escalation") && lower.includes("requested")) return "escalation_requested";
    if (lower.includes("assigned")) return "escalation_assigned";
    if (lower === "today" || lower === "yesterday" || !isNaN(Date.parse(content))) return "date_separator";
    return "custom";
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
    showNoAgentsForm,
    onNoAgentsFormSubmit,
    onNoAgentsFormDismiss,
    storedLead,
    conversationState,
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

    // Group messages by date and render timeline items
    const renderMessages = () => {
        const result: JSX.Element[] = [];
        let currentDate: string | null = null;
        let groupIndex = 0;

        // Iterate through messages
        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            const timestamp = msg.timestamp || new Date();
            const dateStr = timestamp.toDateString();

            // Add date separator when date changes
            if (dateStr !== currentDate) {
                currentDate = dateStr;
                // Add date separator as a timeline message
                result.push(
                    <DateSeparator key={`date-${groupIndex}`} date={timestamp} />
                );
                groupIndex++;
            }

            // Check if this is a timeline/system message
            if (isTimelineMessage(msg)) {
                const eventType = getTimelineEventType(msg.content);
                result.push(
                    <TimelineMessage
                        key={msg.id}
                        type={eventType}
                        content={msg.content}
                        timestamp={msg.timestamp}
                    />
                );
                continue;
            }

            // Regular message rendering
            const isAgent = msg.role === "agent";
            const agentName = assignedAgent?.displayName || "Agent";
            const agentAvatar = assignedAgent?.avatarUrl;

            result.push(
                <div key={msg.id} className="mb-1 group">
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
                                    <LoadingMessages />
                                )
                            ) : (
                                <span>{msg.content}</span>
                            )}
                            {/* Citations */}
                            {(() => {
                                const hasCitations = (msg.role === "assistant" || isAgent) && msg.citations && msg.citations.length > 0;
                                if (msg.role === "assistant") {
                                    console.log(`Msg ${msg.id} citations:`, msg.citations);
                                }
                                return hasCitations && (
                                    <MessageCitations citations={msg.citations} />
                                );
                            })()}
                        </MessageContent>
                    </MessageBubble>

                    {/* Footer: Timestamp + Actions on the same line */}
                    <div className={cn(
                        "px-4 mt-1 flex items-center gap-3",
                        msg.role === "user" ? "justify-end" : "justify-start"
                    )}>
                        {(msg.id === messages[messages.length - 1]?.id || revealedMessageIds.has(msg.id)) && (
                            <MessageTimestamp
                                date={msg.timestamp || new Date()}
                                format="time"
                            />
                        )}

                        {/* Actions for Assistant Messages */}
                        {(msg.role === "assistant" || isAgent) && msg.content && (
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
                        )}
                    </div>
                </div>
            );
        }

        return result;
    };

    // Get suggested messages from config (show only when no user messages yet)
    const hasUserMessages = messages.some((m) => m.role === "user");
    const showSuggestions = !hasUserMessages && config.suggestedMessages?.length;

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
                            <div className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
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
                    {renderMessages()}

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
                            <div className="mt-1 px-4 text-left">
                                <span className="text-[10px] text-gray-400">Just now</span>
                            </div>
                        </div>
                    )}

                    {/* No Agents Online Form as a Message Bubble */}
                    {showNoAgentsForm && onNoAgentsFormSubmit && onNoAgentsFormDismiss && (
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

                            <MessageBubble from="assistant" fullWidth={true}>
                                <MessageContent>
                                    <NoAgentsForm
                                        config={config}
                                        onSubmit={onNoAgentsFormSubmit}
                                        onDismiss={onNoAgentsFormDismiss}
                                        storedLead={storedLead}
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
                        <div className="mb-3 px-4">
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
                </ConversationContent>
            </ConversationContainer>

            {/* Input Area - Hidden when conversation is ended */}
            {conversationState !== "RESOLVED" && conversationState !== "CLOSED" ? (
                <ChatInput
                    config={config}
                    input={input}
                    setInput={setInput}
                    handleSendMessage={handleSubmit}
                    handleSuggestionClick={handleSubmit}
                    hasUserMessages={hasUserMessages}
                    disabled={status === "streaming"}
                />
            ) : (
                <div className="px-4 py-6 text-center border-t border-gray-100 flex flex-col items-center gap-2">
                    <CheckCircle2 className={cn(
                        "w-5 h-5",
                        conversationState === "RESOLVED" ? "text-green-600" : "text-gray-400"
                    )} />
                    <span className="text-sm text-gray-500">Your conversation has ended</span>
                </div>
            )}

            {/* Footer text if configured */}
            {
                config.footerText && (
                    <div className="px-4 pb-2 text-center">
                        <span className="text-xs text-gray-400">{config.footerText}</span>
                    </div>
                )
            }

            {/* Clickable Branding */}
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

        </div >
    );
}
