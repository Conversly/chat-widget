"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, X, MoreHorizontal, Paperclip, Smile, Image, Mic, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetConfig, Conversation, Message } from "@/types/widget";

interface ChatViewProps {
    config: WidgetConfig;
    conversation: Conversation;
    messages: Message[];
    onClose: () => void;
    onBack: () => void;
    onSendMessage: (content: string) => void;
}

export function ChatView({
    config,
    conversation,
    messages,
    onClose,
    onBack,
    onSendMessage,
}: ChatViewProps) {
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Format timestamp
    const formatMessageTime = (date: Date): string => {
        const now = new Date();
        const diffDays = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 0) {
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        } else if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: "short" });
        } else {
            return date.toLocaleDateString([], { month: "short", day: "numeric" });
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

    // Handle submit
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onSendMessage(input.trim());
            setInput("");
            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }
        }
    };

    // Handle keydown for enter to send
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    // Group messages by date
    const groupedMessages: { date: Date; messages: Message[] }[] = [];
    let currentDate: string | null = null;

    messages.forEach((msg) => {
        const dateStr = msg.timestamp.toDateString();
        if (dateStr !== currentDate) {
            currentDate = dateStr;
            groupedMessages.push({ date: msg.timestamp, messages: [msg] });
        } else {
            groupedMessages[groupedMessages.length - 1].messages.push(msg);
        }
    });

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div
                className={cn(
                    "flex items-center justify-between px-3 py-3 border-b",
                    config.appearance === "dark"
                        ? "bg-gray-900 border-gray-800"
                        : "bg-white border-gray-200"
                )}
            >
                <div className="flex items-center gap-2">
                    <button
                        onClick={onBack}
                        className={cn(
                            "p-1 rounded transition-colors",
                            config.appearance === "dark"
                                ? "text-gray-400 hover:text-white hover:bg-gray-800"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                        )}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Agent Avatar */}
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-300">
                        {conversation.agent.avatar ? (
                            <img
                                src={conversation.agent.avatar}
                                alt={conversation.agent.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm font-medium text-gray-600">
                                {conversation.agent.name.charAt(0)}
                            </div>
                        )}
                    </div>

                    {/* Agent Info */}
                    <div>
                        <p
                            className={cn(
                                "font-medium text-sm leading-tight",
                                config.appearance === "dark" ? "text-white" : "text-gray-900"
                            )}
                        >
                            {conversation.agent.name}
                        </p>
                        <p
                            className={cn(
                                "text-xs",
                                conversation.agent.status === "online"
                                    ? "text-green-500"
                                    : config.appearance === "dark"
                                        ? "text-gray-500"
                                        : "text-gray-400"
                            )}
                        >
                            {conversation.agent.status === "online"
                                ? "Active now"
                                : `Active ${formatMessageTime(conversation.lastMessageTime)}`}
                        </p>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className={cn(
                        "p-2 rounded transition-colors",
                        config.appearance === "dark"
                            ? "text-gray-400 hover:text-white hover:bg-gray-800"
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                    )}
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Messages Area */}
            <div
                className={cn(
                    "flex-1 overflow-y-auto px-4 py-4",
                    config.appearance === "dark" ? "bg-gray-900" : "bg-gray-50"
                )}
            >
                {groupedMessages.map((group, groupIdx) => (
                    <div key={groupIdx}>
                        {/* Date Separator */}
                        <div className="flex items-center justify-center my-4">
                            <span
                                className={cn(
                                    "text-xs px-3 py-1",
                                    config.appearance === "dark"
                                        ? "text-gray-500"
                                        : "text-gray-400"
                                )}
                            >
                                {formatDateSeparator(group.date)}
                            </span>
                        </div>

                        {/* Messages */}
                        {group.messages.map((message, msgIdx) => {
                            const isUser = message.role === "user";
                            const isSystem = message.role === "system";
                            const showAgentJoined =
                                msgIdx === 0 && message.role === "assistant" && groupIdx === 0;

                            return (
                                <div key={message.id}>
                                    {/* Agent joined notice */}
                                    {showAgentJoined && (
                                        <div className="flex items-center justify-center gap-2 my-3">
                                            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-300">
                                                {conversation.agent.avatar ? (
                                                    <img
                                                        src={conversation.agent.avatar}
                                                        alt={conversation.agent.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs font-medium text-gray-600">
                                                        {conversation.agent.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <span
                                                className={cn(
                                                    "text-xs",
                                                    config.appearance === "dark"
                                                        ? "text-gray-500"
                                                        : "text-gray-400"
                                                )}
                                            >
                                                <strong
                                                    className={
                                                        config.appearance === "dark"
                                                            ? "text-gray-300"
                                                            : "text-gray-600"
                                                    }
                                                >
                                                    {conversation.agent.name}
                                                </strong>{" "}
                                                joined the conversation
                                            </span>
                                        </div>
                                    )}

                                    {/* Message Bubble */}
                                    <div
                                        className={cn(
                                            "flex mb-2",
                                            isUser ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "max-w-[75%] px-4 py-2 rounded-2xl",
                                                isUser
                                                    ? "rounded-br-md text-white"
                                                    : config.appearance === "dark"
                                                        ? "bg-gray-800 text-white rounded-bl-md"
                                                        : "bg-white text-gray-900 rounded-bl-md shadow-sm"
                                            )}
                                            style={
                                                isUser ? { backgroundColor: config.primaryColor } : {}
                                            }
                                        >
                                            <p className="text-sm whitespace-pre-wrap">
                                                {message.content}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Agent name and time for assistant messages */}
                                    {!isUser && msgIdx === group.messages.filter(m => m.role === "assistant").length - 1 && (
                                        <div className="flex items-center gap-1 mb-3 ml-1">
                                            <span
                                                className={cn(
                                                    "text-xs",
                                                    config.appearance === "dark"
                                                        ? "text-gray-500"
                                                        : "text-gray-400"
                                                )}
                                            >
                                                {conversation.agent.name} •{" "}
                                                {formatMessageTime(message.timestamp)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}

                {/* Suggested Messages - show when no user messages yet */}
                {config.suggestedMessages && config.suggestedMessages.length > 0 &&
                    !messages.some(m => m.role === "user") && (
                        <div className="mt-4 space-y-2">
                            <p
                                className={cn(
                                    "text-xs font-medium uppercase tracking-wider",
                                    config.appearance === "dark" ? "text-gray-400" : "text-gray-500"
                                )}
                            >
                                Suggested Questions
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {config.suggestedMessages.map((message, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => onSendMessage(message)}
                                        className={cn(
                                            "px-3 py-2 rounded-full text-sm transition-colors border",
                                            config.appearance === "dark"
                                                ? "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
                                                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                        )}
                                        style={{
                                            borderColor: `${config.primaryColor}30`,
                                        }}
                                    >
                                        {message}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div
                className={cn(
                    "px-4 py-3 border-t",
                    config.appearance === "dark"
                        ? "bg-gray-900 border-gray-800"
                        : "bg-white border-gray-200"
                )}
            >
                <form onSubmit={handleSubmit} className="relative">
                    <div
                        className={cn(
                            "flex items-end gap-2 px-4 py-3 rounded-2xl border",
                            config.appearance === "dark"
                                ? "bg-gray-800 border-gray-700"
                                : "bg-gray-50 border-gray-200"
                        )}
                    >
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                // Auto-resize
                                e.target.style.height = "auto";
                                e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder={config.placeholder}
                            rows={1}
                            className={cn(
                                "flex-1 bg-transparent border-none outline-none resize-none text-sm",
                                config.appearance === "dark"
                                    ? "text-white placeholder:text-gray-500"
                                    : "text-gray-900 placeholder:text-gray-400"
                            )}
                            style={{ maxHeight: "100px" }}
                        />

                        {/* Action buttons */}
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                className={cn(
                                    "p-1.5 rounded transition-colors",
                                    config.appearance === "dark"
                                        ? "text-gray-500 hover:text-gray-300"
                                        : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <Paperclip className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                className={cn(
                                    "p-1.5 rounded transition-colors",
                                    config.appearance === "dark"
                                        ? "text-gray-500 hover:text-gray-300"
                                        : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <Smile className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                className={cn(
                                    "p-1.5 rounded transition-colors",
                                    config.appearance === "dark"
                                        ? "text-gray-500 hover:text-gray-300"
                                        : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <Image className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                className={cn(
                                    "p-1.5 rounded transition-colors",
                                    config.appearance === "dark"
                                        ? "text-gray-500 hover:text-gray-300"
                                        : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <Mic className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Send button (appears when input has text) */}
                    {input.trim() && (
                        <button
                            type="submit"
                            className="absolute right-2 bottom-2 p-2 rounded-full text-white transition-colors hover:opacity-90"
                            style={{ backgroundColor: config.primaryColor }}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
