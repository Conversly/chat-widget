"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface LoadingMessagesProps {
    className?: string;
}

const defaultMessages = [
    "Thinking...",
    "Analyzing your question...",
    "Searching for the best answer...",
    "Almost there...",
    "Getting things ready for you...",
];

export function LoadingMessages({ className }: LoadingMessagesProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Show each message for 3 seconds before transitioning
        const messageInterval = setInterval(() => {
            setIsVisible(false);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % defaultMessages.length);
                setIsVisible(true);
            }, 300); // Brief fade out before changing message
        }, 3000);

        return () => clearInterval(messageInterval);
    }, []);

    return (
        <div className={cn("flex items-center gap-2 h-5 px-1", className)}>
            <div className="flex gap-1 items-center mr-2">
                <span
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{
                        backgroundColor: "#9ca3af",
                        animationDelay: "0ms",
                    }}
                />
                <span
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{
                        backgroundColor: "#9ca3af",
                        animationDelay: "150ms",
                    }}
                />
                <span
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{
                        backgroundColor: "#9ca3af",
                        animationDelay: "300ms",
                    }}
                />
            </div>
            <span
                className={cn(
                    "text-sm text-gray-500 transition-opacity duration-300",
                    isVisible ? "opacity-100" : "opacity-0"
                )}
            >
                {defaultMessages[currentIndex]}
            </span>
        </div>
    );
}
