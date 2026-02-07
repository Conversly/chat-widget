"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Conversation - Scrollable chat container with auto-scroll
 */
interface ConversationProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

const ConversationContext = React.createContext<{
    scrollRef: React.RefObject<HTMLDivElement | null>;
    scrollToBottom: (behavior?: ScrollBehavior) => void;
    isAtBottom: boolean;
}>({
    scrollRef: { current: null },
    scrollToBottom: () => { },
    isAtBottom: true,
});

export function useConversation() {
    return React.useContext(ConversationContext);
}

export function Conversation({ children, className, ...props }: ConversationProps) {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [isAtBottom, setIsAtBottom] = React.useState(true);

    const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "smooth") => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior,
            });
        }
    }, []);

    const handleScroll = React.useCallback(() => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const threshold = 100;
        setIsAtBottom(scrollHeight - scrollTop - clientHeight < threshold);
    }, []);

    return (
        <ConversationContext.Provider value={{ scrollRef, scrollToBottom, isAtBottom }}>
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className={cn(
                    "flex-1 overflow-y-auto overflow-x-hidden",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        </ConversationContext.Provider>
    );
}

/**
 * ConversationContent - Container for messages with proper spacing
 */
export function ConversationContent({
    children,
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("flex flex-col gap-4 p-4", className)} {...props}>
            {children}
        </div>
    );
}

/**
 * ConversationScrollButton - Button to scroll to bottom when not at bottom
 */
interface ConversationScrollButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    showAlways?: boolean;
}

export function ConversationScrollButton({
    className,
    showAlways = false,
    ...props
}: ConversationScrollButtonProps) {
    const { scrollToBottom, isAtBottom } = useConversation();

    if (!showAlways && isAtBottom) return null;

    return (
        <button
            onClick={() => scrollToBottom()}
            className={cn(
                "absolute bottom-4 left-1/2 -translate-x-1/2",
                "flex items-center justify-center",
                "w-8 h-8 rounded-full",
                "bg-white shadow-md border border-gray-200",
                "hover:bg-gray-50 transition-colors",
                "text-gray-600",
                className
            )}
            {...props}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M12 5v14" />
                <path d="m19 12-7 7-7-7" />
            </svg>
        </button>
    );
}
