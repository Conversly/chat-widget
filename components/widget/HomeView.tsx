"use client";

import { X, Home, MessageSquare, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetConfig, NewsFeedItem } from "@/types/chatbot";
import type { Conversation } from "@/types/activity";

interface HomeViewProps {
    config: WidgetConfig;
    onClose: () => void;
    onStartConversation: () => void;
    onViewMessages: () => void;
    onSuggestedMessageClick?: (message: string) => void;
    conversations: Conversation[];
}

export function HomeView({
    config,
    onClose,
    onStartConversation,
    onViewMessages,
    onSuggestedMessageClick,
    conversations,
}: HomeViewProps) {
    const unreadCount = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

    return (
        <div className="h-full flex flex-col">
            {/* Header with brand color */}
            <div
                className="relative px-6 pt-6 pb-8 rounded-t-2xl"
                style={{ backgroundColor: config.primaryColor }}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Brand and avatars */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        {config.brandLogo ? (
                            <img src={config.brandLogo} alt={config.brandName} className="h-6" />
                        ) : (
                            <span className="text-white font-semibold text-lg">{config.brandName}</span>
                        )}
                    </div>

                    {/* Agent avatars removed per customization request */}
                </div>

                {/* Greeting */}
                <div className="text-white">
                    <h1 className="text-2xl font-semibold mb-1">
                        {config.userName ? `Hi ${config.userName} 👋` : "Hi there 👋"}
                    </h1>
                    <p className="text-white/90 text-lg">{config.greeting}</p>
                </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {/* Send us a message button */}
                <button
                    onClick={onStartConversation}
                    className={cn(
                        "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors",
                        config.appearance === "dark"
                            ? "bg-gray-800 hover:bg-gray-700 text-white"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                    )}
                >
                    <span className="font-medium">Send us a message</span>
                    <Send className="w-4 h-4" style={{ color: config.primaryColor }} />
                </button>

                {/* Suggested Messages */}
                {config.suggestedMessages && config.suggestedMessages.length > 0 && (
                    <div className="space-y-2">
                        <p
                            className={cn(
                                "text-xs font-medium uppercase tracking-wider",
                                config.appearance === "dark" ? "text-gray-400" : "text-gray-500"
                            )}
                        >
                            Quick Questions
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {config.suggestedMessages.map((message, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onSuggestedMessageClick?.(message)}
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

                {/* News Feed */}
                {config.enableNewsFeed && config.newsFeedItems && config.newsFeedItems.length > 0 && (
                    <div className="space-y-3">
                        {config.newsFeedItems.map((item) => (
                            <NewsFeedCard key={item.id} item={item} config={config} />
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <BottomNav
                config={config}
                activeTab="home"
                onHomeClick={() => { }}
                onMessagesClick={onViewMessages}
                unreadCount={unreadCount}
            />
        </div>
    );
}

interface NewsFeedCardProps {
    item: NewsFeedItem;
    config: WidgetConfig;
}

function NewsFeedCard({ item, config }: NewsFeedCardProps) {
    return (
        <div
            className={cn(
                "rounded-lg border overflow-hidden",
                config.appearance === "dark"
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
            )}
        >
            <div className="p-4">
                {item.version && (
                    <div className="flex items-center gap-2 mb-2">
                        <span
                            className="text-xs font-medium px-2 py-0.5 rounded"
                            style={{
                                backgroundColor: `${config.primaryColor}20`,
                                color: config.primaryColor,
                            }}
                        >
                            {item.version}
                        </span>
                    </div>
                )}
                <h3
                    className={cn(
                        "font-semibold text-sm mb-1",
                        config.appearance === "dark" ? "text-white" : "text-gray-900"
                    )}
                >
                    {item.title}
                </h3>
                <p
                    className={cn(
                        "text-xs line-clamp-2",
                        config.appearance === "dark" ? "text-gray-400" : "text-gray-600"
                    )}
                >
                    {item.description}
                </p>
            </div>
            {item.image && (
                <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-32 object-cover"
                />
            )}
        </div>
    );
}

interface BottomNavProps {
    config: WidgetConfig;
    activeTab: "home" | "messages";
    onHomeClick: () => void;
    onMessagesClick: () => void;
    unreadCount?: number;
}

export function BottomNav({
    config,
    activeTab,
    onHomeClick,
    onMessagesClick,
    unreadCount = 0,
}: BottomNavProps) {
    return (
        <div
            className={cn(
                "flex items-center justify-around py-3 border-t",
                config.appearance === "dark"
                    ? "bg-gray-900 border-gray-800"
                    : "bg-white border-gray-200"
            )}
        >
            <button
                onClick={onHomeClick}
                className={cn(
                    "flex flex-col items-center gap-1 px-6 py-1 transition-colors",
                    activeTab === "home"
                        ? config.appearance === "dark"
                            ? "text-white"
                            : "text-gray-900"
                        : config.appearance === "dark"
                            ? "text-gray-500"
                            : "text-gray-400"
                )}
            >
                <Home className="w-5 h-5" />
                <span className="text-xs font-medium">Home</span>
            </button>

            <button
                onClick={onMessagesClick}
                className={cn(
                    "flex flex-col items-center gap-1 px-6 py-1 transition-colors relative",
                    activeTab === "messages"
                        ? config.appearance === "dark"
                            ? "text-white"
                            : "text-gray-900"
                        : config.appearance === "dark"
                            ? "text-gray-500"
                            : "text-gray-400"
                )}
            >
                <div className="relative">
                    <MessageSquare className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span
                            className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full text-xs text-white"
                            style={{ backgroundColor: config.primaryColor }}
                        >
                            {unreadCount}
                        </span>
                    )}
                </div>
                <span className="text-xs font-medium">Messages</span>
            </button>
        </div>
    );
}
