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
    "Consulting the knowledge base...",
    "Finding the most accurate information...",
    "Crafting a thoughtful response...",
    "Double-checking the details...",
    "Connecting the dots for you...",
    "Synthesizing insights...",
    "Reviewing multiple sources...",
    "Polishing the perfect answer...",
    "This will be worth the wait...",
    "Preparing something helpful...",
];

export function LoadingMessages({ className }: LoadingMessagesProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Show each message for 6 seconds before transitioning
        const messageInterval = setInterval(() => {
            setIsVisible(false);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % defaultMessages.length);
                setIsVisible(true);
            }, 300); // Brief fade out before changing message
        }, 6000);

        return () => clearInterval(messageInterval);
    }, []);

    return (
        <div className={cn("flex items-center gap-2.5 h-5 px-0.5", className)}>
            <span className="flex items-end gap-[3px] pb-px">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400/80 animate-bounce [animation-delay:-0.3s] [animation-duration:1s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400/80 animate-bounce [animation-delay:-0.15s] [animation-duration:1s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400/80 animate-bounce [animation-duration:1s]" />
            </span>
            <span
                className={cn(
                    "text-[12.5px] text-gray-400 transition-opacity duration-300 tracking-tight",
                    isVisible ? "opacity-100" : "opacity-0"
                )}
            >
                {defaultMessages[currentIndex]}
            </span>
        </div>
    );
}
