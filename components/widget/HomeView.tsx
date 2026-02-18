"use client";

import { useState, useRef, useEffect } from "react";

import { X, Home, MessageSquare, Send, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetConfig, NewsFeedItem } from "@/types/chatbot";
import type { Conversation } from "@/types/activity";
import { formatDistanceToNow } from "date-fns";

interface HomeViewProps {
    config: WidgetConfig;
    onClose: () => void;
    onStartConversation: () => void;
    onViewMessages: () => void;
    onSelectConversation: (conversation: Conversation) => void;
    onSuggestedMessageClick?: (message: string) => void;
    conversations: Conversation[];
}

export function HomeView({
    config,
    onClose,
    onStartConversation,
    onViewMessages,
    onSelectConversation,
    onSuggestedMessageClick,
    conversations,
}: HomeViewProps) {
    const unreadCount = conversations.reduce((acc, c) => acc + c.unreadCount, 0);
    const recentConversation = conversations.length > 0 ? conversations[0] : null;

    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleScroll = () => {
        setIsScrolling(true);
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
            setIsScrolling(false);
        }, 1500); // Keep scrollbar visible for 1.5s after scrolling stops
    };

    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    // Helper to format time relative to now (e.g. "2h ago")
    const formatTime = (date: Date) => {
        try {
            return formatDistanceToNow(date, { addSuffix: true })
                .replace("about ", "")
                .replace("less than a minute ago", "just now");
        } catch (e) {
            return "";
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50/50">
            {/* Header with Gradient */}
            <div
                className="relative px-6 pt-6 pb-24 rounded-b-[2rem] shadow-sm"
                style={{
                    background: `linear-gradient(135deg, ${config.primaryColor}, ${config.primaryColor}dd, ${config.primaryColor}aa)`,
                }}
            >
                {/* Close Button & Header Actions */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        {/* Optional: Add back button or other header actions here if needed */}
                        {/* For now, just Brand Name/Logo per design */}
                        <div className="flex items-center gap-2 text-white/90">
                            {config.brandLogo ? (
                                <img src={config.brandLogo} alt={config.brandName} className="h-6 w-auto object-contain" />
                            ) : config.widgetIcon ? (
                                <img src={config.widgetIcon} alt="Logo" className="h-6 w-6" />
                            ) : null}
                            <span className="font-semibold text-lg tracking-tight">{config.brandName || "Support"}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Greeting */}
                <div className="text-white relative z-10">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        {config.greeting || <>Hi there <span className="animate-wave origin-bottom-right inline-block">👋</span></>}
                    </h1>
                </div>
            </div>

            {/* Content Area - Negative Margin to overlap header */}
            <div
                onScroll={handleScroll}
                className={cn(
                    "flex-1 overflow-y-auto px-4 -mt-16 relative z-20 pb-4 space-y-4 thin-scrollbar",
                    isScrolling && "scrolling"
                )}
            >

                {/* Recent Message Card */}
                {recentConversation && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Recent Message
                            </h3>
                        </div>

                        <button
                            onClick={() => onSelectConversation(recentConversation)}
                            className="w-full text-left group"
                        >
                            <div className="flex items-start gap-3">
                                <div className="relative shrink-0">
                                    {recentConversation.agent.avatar ? (
                                        <img
                                            src={recentConversation.agent.avatar}
                                            alt={recentConversation.agent.name}
                                            className="w-10 h-10 rounded-full object-cover bg-gray-100"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                                            {recentConversation.agent.name.charAt(0)}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="font-semibold text-gray-900 text-sm">
                                            Chat with {recentConversation.agent.name}
                                        </span>
                                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                            {formatTime(new Date(recentConversation.lastMessageTime))}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                                        {recentConversation.lastMessage || "Click to continue conversation..."}
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>
                )}

                {/* Send us a message Card */}
                <button
                    onClick={onStartConversation}
                    className="w-full text-left bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
                >
                    <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-gray-900">
                            Send us a message
                        </h3>
                        <div
                            className="w-8 h-8 flex items-center justify-center rounded-full text-white transition-transform group-hover:scale-105 shadow-md"
                            style={{ backgroundColor: config.primaryColor }}
                        >
                            <Send className="w-4 h-4 ml-0.5" />
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 leading-relaxed mb-4">
                        Ask us anything about our platform or system status.
                    </p>

                    {/* Footer / Avatars */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                            Typically replies in under 5 mins
                        </span>
                    </div>
                </button>

                {/* Suggested Messages */}
                {config.suggestedMessages && config.suggestedMessages.length > 0 && (
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-1">
                            Suggested
                        </h3>
                        <p className="text-xs text-gray-400 mb-4">
                            Frequently asked questions
                        </p>

                        <div className="flex flex-wrap gap-2">
                            {config.suggestedMessages.map((message, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onSuggestedMessageClick?.(message)}
                                    className="group flex items-center gap-2 pl-4 pr-3 py-2.5 rounded-xl text-sm transition-all border w-full text-left hover:shadow-md bg-transparent border-gray-200 hover:bg-gray-50"
                                >
                                    <span className="flex-1 truncate text-gray-700">
                                        {message}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* News Feed */}
                {config.enableNewsFeed && config.newsFeedItems && config.newsFeedItems.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="px-1 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Latest Updates
                        </h3>
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
        <div className="rounded-lg border bg-white border-gray-200 overflow-hidden">
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
                <h3 className="font-semibold text-sm mb-1 text-gray-900">
                    {item.title}
                </h3>
                <p className="text-xs line-clamp-2 text-gray-600">
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
        <div className="flex items-center justify-around py-3 border-t bg-white border-gray-200">
            <button
                onClick={onHomeClick}
                className={cn(
                    "flex flex-col items-center gap-1 px-6 py-1 transition-colors",
                    activeTab === "home" ? "text-gray-900" : "text-gray-400"
                )}
            >
                <Home className="w-5 h-5" />
                <span className="text-xs font-medium">Home</span>
            </button>

            <button
                onClick={onMessagesClick}
                className={cn(
                    "flex flex-col items-center gap-1 px-6 py-1 transition-colors relative",
                    activeTab === "messages" ? "text-gray-900" : "text-gray-400"
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
