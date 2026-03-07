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
        <div className={cn("flex items-center h-5 px-1", className)}>
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
