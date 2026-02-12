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
    fullWidth?: boolean;
}

export function Message({ from, children, className, onBubbleClick, fullWidth, ...props }: MessageProps) {
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
                    "rounded-2xl px-4 py-3",
                    fullWidth ? "w-full" : "max-w-full",
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

/**
 * MessageCitations - Citations list with image carousel
 */
import { ImageCarousel } from "@/components/widget/ImageCarousel";

interface MessageCitationsProps {
    citations?: string[];
}

export function MessageCitations({ citations }: MessageCitationsProps) {
    console.log("MessageCitations render:", citations);
    const [showAll, setShowAll] = React.useState(false);
    if (!citations || citations.length === 0) return null;

    // Filter citations into images and links
    const isImage = (url: string) => {
        try {
            const extension = new URL(url).pathname.split('.').pop()?.toLowerCase();
            return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '');
        } catch {
            return false;
        }
    };

    const images = citations.filter(isImage);
    const links = citations.filter(c => !isImage(c));

    const maxVisible = 3;
    const hasMore = links.length > maxVisible;
    const visibleLinks = showAll ? links : links.slice(0, maxVisible);

    const parseCitation = (citation: string): { href?: string; label: string } => {
        const raw = (citation || "").trim();
        if (!raw) return { label: "" };

        // Absolute URLs
        try {
            const u = new URL(raw);
            return { href: u.href, label: u.hostname.replace(/^www\./, "") || raw };
        } catch {
            // continue
        }

        // Relative URLs (best-effort)
        if (typeof window !== "undefined") {
            try {
                const u = new URL(raw, window.location.origin);
                return { href: u.href, label: u.hostname.replace(/^www\./, "") || raw };
            } catch {
                // continue
            }
        }

        return { label: raw };
    }

    if (images.length === 0 && links.length === 0) return null;

    return (
        <div className="mt-2 space-y-2">
            {/* Image Carousel */}
            {images.length > 0 && (
                <ImageCarousel images={images} />
            )}

            {/* Link Citations (CitationsBlock style) */}
            {links.length > 0 && (
                <div className="w-full">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-gray-500 mr-0.5">
                            Sources:
                        </span>
                        {visibleLinks.map((citation, index) => {
                            const parsed = parseCitation(citation);
                            if (!parsed.label) return null;

                            const Chip = parsed.href ? "a" : "span";
                            return (
                                <Chip
                                    key={`${citation}-${index}`}
                                    {...(parsed.href
                                        ? { href: parsed.href, target: "_blank", rel: "noopener noreferrer" }
                                        : {})}
                                    className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-600 border border-gray-100"
                                    title={citation}
                                >
                                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gray-200 text-[9px] font-medium text-gray-600">
                                        {index + 1}
                                    </span>
                                    <span className="max-w-[120px] truncate">{parsed.label}</span>
                                </Chip>
                            );
                        })}
                        {hasMore && !showAll && (
                            <button
                                onClick={() => setShowAll(true)}
                                className="inline-flex items-center gap-0.5 rounded-full bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-500 transition-colors hover:bg-gray-100 border border-gray-100"
                            >
                                +{links.length - maxVisible} more
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
