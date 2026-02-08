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

export interface AssignedAgentInfo {
    displayName: string | null;
    avatarUrl: string | null;
}

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
}: ChatViewProps) {
    const [input, setInput] = useState("");
    const [showNotice, setShowNotice] = useState(true);

    // Handle submit
    const handleSubmit = (text: string) => {
        if (text.trim()) {
            onSendMessage(text.trim());
            setInput("");
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
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                            {conversation.agent.avatar || config.botAvatar || config.widgetIcon ? (
                                <img
                                    src={conversation.agent.avatar || config.botAvatar || config.widgetIcon}
                                    alt={conversation.agent.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                conversation.agent.name.charAt(0)
                            )}
                        </div>
                        <div>
                            <div className="font-medium text-gray-900 text-sm">
                                {conversation.agent.name}
                            </div>
                            <div className="text-xs text-green-600 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                {conversation.agent.status === "online" ? "Online" : "Away"}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors outline-none"
                                title="More options"
                            >
                                <MoreHorizontal className="w-5 h-5 text-gray-600" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
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
                className="flex-1 relative"
                messages={messages}
                scrollButton={<ConversationScrollButton />}
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
                                    <div key={msg.id} className="mb-3">
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

                                        <MessageBubble from={msg.role === "user" ? "user" : "assistant"}>
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
            {config.footerText && (
                <div className="px-4 pb-2 text-center">
                    <span className="text-xs text-gray-400">{config.footerText}</span>
                </div>
            )}
        </div>
    );
}
