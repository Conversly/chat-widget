"use client";

import { X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetConfig, Conversation } from "@/types/widget";
import { BottomNav } from "./HomeView";

interface MessagesViewProps {
    config: WidgetConfig;
    conversations: Conversation[];
    onClose: () => void;
    onSelectConversation: (conversation: Conversation) => void;
    onStartNewConversation: () => void;
    onGoHome: () => void;
}

export function MessagesView({
    config,
    conversations,
    onClose,
    onSelectConversation,
    onStartNewConversation,
    onGoHome,
}: MessagesViewProps) {
    const unreadCount = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

    // Format relative time
    const formatRelativeTime = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays}d`;
        if (diffWeeks < 4) return `${diffWeeks}w`;
        return `${diffMonths}mo`;
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div
                className={cn(
                    "flex items-center justify-between px-4 py-3 border-b",
                    config.appearance === "dark"
                        ? "bg-gray-900 border-gray-800"
                        : "bg-white border-gray-200"
                )}
            >
                <h2
                    className={cn(
                        "text-lg font-semibold",
                        config.appearance === "dark" ? "text-white" : "text-gray-900"
                    )}
                >
                    Messages
                </h2>
                <button
                    onClick={onClose}
                    className={cn(
                        "transition-colors",
                        config.appearance === "dark"
                            ? "text-gray-400 hover:text-white"
                            : "text-gray-500 hover:text-gray-900"
                    )}
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
                        <div
                            className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center mb-4",
                                config.appearance === "dark" ? "bg-gray-800" : "bg-gray-100"
                            )}
                        >
                            <Send
                                className="w-8 h-8"
                                style={{ color: config.primaryColor }}
                            />
                        </div>
                        <h3
                            className={cn(
                                "font-semibold mb-2",
                                config.appearance === "dark" ? "text-white" : "text-gray-900"
                            )}
                        >
                            No messages yet
                        </h3>
                        <p
                            className={cn(
                                "text-sm mb-4",
                                config.appearance === "dark" ? "text-gray-400" : "text-gray-600"
                            )}
                        >
                            Start a conversation with our team
                        </p>
                        <button
                            onClick={onStartNewConversation}
                            className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors hover:opacity-90"
                            style={{ backgroundColor: config.primaryColor }}
                        >
                            Send us a message
                        </button>
                    </div>
                ) : (
                    <div className="divide-y">
                        {conversations.map((conversation) => (
                            <button
                                key={conversation.id}
                                onClick={() => onSelectConversation(conversation)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                                    config.appearance === "dark"
                                        ? "hover:bg-gray-800 divide-gray-800"
                                        : "hover:bg-gray-50 divide-gray-200"
                                )}
                            >
                                {/* Agent Avatar */}
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-300 flex-shrink-0">
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

                                {/* Conversation Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span
                                            className={cn(
                                                "font-medium text-sm",
                                                config.appearance === "dark"
                                                    ? "text-white"
                                                    : "text-gray-900"
                                            )}
                                        >
                                            Chat with {conversation.agent.name}
                                        </span>
                                        <span
                                            className={cn(
                                                "text-xs",
                                                config.appearance === "dark"
                                                    ? "text-gray-500"
                                                    : "text-gray-400"
                                            )}
                                        >
                                            {formatRelativeTime(conversation.lastMessageTime)}
                                        </span>
                                    </div>
                                    <p
                                        className={cn(
                                            "text-sm truncate",
                                            config.appearance === "dark"
                                                ? "text-gray-400"
                                                : "text-gray-600"
                                        )}
                                    >
                                        {conversation.lastMessage}
                                    </p>
                                </div>

                                {/* Unread Badge */}
                                {conversation.unreadCount > 0 && (
                                    <span
                                        className="w-5 h-5 flex items-center justify-center rounded-full text-xs text-white"
                                        style={{ backgroundColor: config.primaryColor }}
                                    >
                                        {conversation.unreadCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* New Message Button (floating) */}
            {conversations.length > 0 && (
                <div className="px-4 py-3">
                    <button
                        onClick={onStartNewConversation}
                        className={cn(
                            "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-medium transition-colors hover:opacity-90"
                        )}
                        style={{ backgroundColor: config.primaryColor }}
                    >
                        <span>Send us a message</span>
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Bottom Navigation */}
            <BottomNav
                config={config}
                activeTab="messages"
                onHomeClick={onGoHome}
                onMessagesClick={() => { }}
                unreadCount={unreadCount}
            />
        </div>
    );
}
