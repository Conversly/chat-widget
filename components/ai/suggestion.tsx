"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Suggestions - Container for suggestion chips
 */
interface SuggestionsProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function Suggestions({ children, className, ...props }: SuggestionsProps) {
    return (
        <div
            className={cn(
                "flex flex-wrap gap-2",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

/**
 * Suggestion - Clickable suggestion chip
 */
interface SuggestionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    suggestion: string;
}

export function Suggestion({
    suggestion,
    className,
    onClick,
    ...props
}: SuggestionProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "px-3 py-2 rounded-full",
                "bg-gray-100 text-gray-700 text-sm",
                "hover:bg-gray-200 transition-colors",
                "whitespace-nowrap",
                className
            )}
            {...props}
        >
            {suggestion}
        </button>
    );
}
