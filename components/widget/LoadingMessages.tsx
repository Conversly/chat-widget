"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingMessagesProps {
    className?: string;
    steps?: string[];
    /** Ms between step reveals. */
    stepDelayMs?: number;
    /** Wait before revealing the first step (avoids flicker for fast responses). */
    initialDelayMs?: number;
}

const DEFAULT_STEPS = [
    "Analyzing your request",
    "Identifying key details",
    "Crafting response",
];

/**
 * LoadingMessages — Progressive checklist shown while the assistant is thinking.
 *
 * Each step appears in sequence with a spinner, then flips to a checkmark when
 * the next step begins. The last step stays "active" until real content replaces
 * this component.
 */
export function LoadingMessages({
    className,
    steps = DEFAULT_STEPS,
    stepDelayMs = 900,
    initialDelayMs = 400,
}: LoadingMessagesProps) {
    const [activeIndex, setActiveIndex] = useState(-1);

    useEffect(() => {
        if (steps.length === 0) return;

        const firstTimer = setTimeout(() => setActiveIndex(0), initialDelayMs);
        const interval = setInterval(() => {
            setActiveIndex((i) => (i < steps.length - 1 ? i + 1 : i));
        }, stepDelayMs);

        return () => {
            clearTimeout(firstTimer);
            clearInterval(interval);
        };
    }, [steps, stepDelayMs, initialDelayMs]);

    if (activeIndex < 0) {
        return (
            <div className={cn("flex items-center gap-2 py-1", className)}>
                <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
            </div>
        );
    }

    const visible = steps.slice(0, activeIndex + 1);

    return (
        <div className={cn("flex flex-col gap-1.5 py-0.5", className)}>
            {visible.map((step, idx) => {
                const isActive = idx === activeIndex;
                return (
                    <div
                        key={step}
                        className="flex items-center gap-2 text-sm animate-in fade-in slide-in-from-bottom-1 duration-300"
                    >
                        {isActive ? (
                            <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin shrink-0" />
                        ) : (
                            <Check className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        )}
                        <span className={cn(
                            "transition-colors",
                            isActive ? "text-gray-600" : "text-gray-400"
                        )}>
                            {step}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
