"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/widget/markdown-renderer";

/**
 * Message - Chat message bubble with role-based styling
 */
interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
    from: "user" | "assistant" | "system";
    children: React.ReactNode;
    onBubbleClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function Message({ from, children, className, onBubbleClick, ...props }: MessageProps) {
    return (
        <div
            className={cn(
                "flex w-full",
                from === "user" ? "justify-end" : "justify-start",
                className
            )}
            {...props}
        >
            <div
                onClick={onBubbleClick}
                className={cn(
                    "max-w-full rounded-2xl px-4 py-3",
                    onBubbleClick && "cursor-pointer",
                    from === "user"
                        ? "bg-black text-white rounded-br-md"
                        : "bg-gray-100 text-gray-900 rounded-bl-md"
                )}
            >
                {children}
            </div>
        </div>
    );
}

/**
 * MessageContent - Container for message text content
 */
export function MessageContent({
    children,
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("text-sm", className)} {...props}>
            {children}
        </div>
    );
}

/**
 * MessageResponse - Markdown-rendered assistant response
 */
interface MessageResponseProps extends React.HTMLAttributes<HTMLDivElement> {
    children: string;
}


export function MessageResponse({
    children,
    className,
    ...props
}: MessageResponseProps) {
    return (
        <div className={cn("w-full", className)} {...props}>
            <MarkdownRenderer>{children}</MarkdownRenderer>
        </div>
    );
}

/**
 * MessageAvatar - Avatar for message sender
 */
interface MessageAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    src?: string;
    alt?: string;
    fallback?: string;
}

export function MessageAvatar({
    src,
    alt = "Avatar",
    fallback,
    className,
    ...props
}: MessageAvatarProps) {
    return (
        <div
            className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                "bg-gray-200 text-gray-600",
                className
            )}
            {...props}
        >
            {src ? (
                <img src={src} alt={alt} className="w-full h-full rounded-full object-cover" />
            ) : (
                fallback || "AI"
            )}
        </div>
    );
}

/**
 * MessageTimestamp - Time display for messages
 */
interface MessageTimestampProps extends React.HTMLAttributes<HTMLSpanElement> {
    date: Date;
    format?: "time" | "relative" | "full";
}

export function MessageTimestamp({
    date,
    format = "time",
    className,
    ...props
}: MessageTimestampProps) {
    const formatTime = (d: Date) => {
        if (format === "time") {
            return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }
        if (format === "relative") {
            const now = new Date();
            const diff = now.getTime() - d.getTime();
            const minutes = Math.floor(diff / 60000);
            if (minutes < 1) return "now";
            if (minutes < 60) return `${minutes}m`;
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `${hours}h`;
            return d.toLocaleDateString([], { month: "short", day: "numeric" });
        }
        return d.toLocaleString();
    };

    return (
        <span className={cn("text-xs text-gray-400", className)} {...props}>
            {formatTime(date)}
        </span>
    );
}

/**
 * MessageStatus - Delivery status indicator
 */
interface MessageStatusProps extends React.HTMLAttributes<HTMLSpanElement> {
    status: "sending" | "sent" | "delivered" | "read" | "error";
}

export function MessageStatus({ status, className, ...props }: MessageStatusProps) {
    const icons: Record<string, React.ReactNode> = {
        sending: (
            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2" strokeDasharray="32" strokeLinecap="round" />
            </svg>
        ),
        sent: (
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
            </svg>
        ),
        delivered: (
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
                <path d="M15 6L4 17" />
            </svg>
        ),
        read: (
            <svg className="w-3 h-3 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
                <path d="M15 6L4 17" />
            </svg>
        ),
        error: (
            <svg className="w-3 h-3 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
            </svg>
        ),
    };

    return (
        <span className={cn("inline-flex", className)} {...props}>
            {icons[status]}
        </span>
    );
}
