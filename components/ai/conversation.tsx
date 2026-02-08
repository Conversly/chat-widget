"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Conversation - Scrollable chat container with auto-scroll
 */
interface ConversationProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    messages?: any[];
    scrollButton?: React.ReactNode;
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

export function Conversation({ children, className, messages = [], scrollButton, ...props }: ConversationProps) {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [isAtBottom, setIsAtBottom] = React.useState(true);
    const prevMessagesLengthRef = React.useRef(messages.length);

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
        const threshold = 100; // Pixel threshold to consider "at bottom"
        // Check if we are close to bottom
        const atBottom = scrollHeight - scrollTop - clientHeight < threshold;
        setIsAtBottom(atBottom);
    }, []);

    // Auto-scroll logic
    React.useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        const isNewMessage = messages.length > prevMessagesLengthRef.current;
        const isUserMessage = lastMessage?.role === 'user';

        // Scroll to bottom if:
        // 1. We were already at the bottom
        // 2. OR it's a message sent by the user (force scroll)
        // 3. OR it's a completely new chat (length 0 -> 1)
        if (isNewMessage) {
            if (isAtBottom || isUserMessage) {
                // Use 'auto' behavior for instant scroll on user send, smooth otherwise? 
                // usually smooth is nice.
                // Timeout allows DOM to update height before scrolling
                setTimeout(() => scrollToBottom("smooth"), 0);
            }
        } else if (messages.length === 0) {
            setIsAtBottom(true);
        }

        prevMessagesLengthRef.current = messages.length;
    }, [messages, isAtBottom, scrollToBottom]);

    // Initial scroll on mount
    React.useEffect(() => {
        scrollToBottom("auto");
    }, []);

    return (
        <ConversationContext.Provider value={{ scrollRef, scrollToBottom, isAtBottom }}>
            <div className={cn("relative flex-1 overflow-hidden", className)} {...props}>
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="h-full w-full overflow-y-auto overflow-x-hidden"
                >
                    {children}
                </div>
                {scrollButton}
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
                "absolute bottom-4 right-4",
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
