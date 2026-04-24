"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import type { WidgetConfig } from "@/types/chatbot";

interface MessageActionsProps {
    config: WidgetConfig;
    content: string;
    isLast: boolean;
    onRegenerate?: () => void;
    onFeedback?: (type: "positive" | "negative") => void;
}

export function MessageActions({
    config,
    content,
    isLast,
    onRegenerate,
    onFeedback,
}: MessageActionsProps) {
    const [copied, setCopied] = useState(false);
    const [feedback, setFeedback] = useState<"positive" | "negative" | null>(null);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const handleFeedback = (type: "positive" | "negative") => {
        setFeedback(type);
        onFeedback?.(type);
    };

    const showFeedback = config.collectUserFeedback && isLast;
    const showRegen = isLast && config.regenerateMessages && onRegenerate;

    const btnBase =
        "inline-flex items-center justify-center h-6 w-6 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors";

    return (
        <div
            className={cn(
                "inline-flex items-center gap-0.5 transition-opacity duration-150",
                isLast ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
        >
            <button onClick={handleCopy} className={btnBase} title={copied ? "Copied" : "Copy"} aria-label="Copy message">
                {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                    <Copy className="w-3.5 h-3.5" />
                )}
            </button>

            {showFeedback && (
                <>
                    <Separator orientation="vertical" className="h-3.5 mx-0.5" />
                    <button
                        onClick={() => handleFeedback("positive")}
                        className={cn(
                            btnBase,
                            feedback === "positive" && "text-emerald-500 hover:text-emerald-600"
                        )}
                        title="Good response"
                        aria-label="Good response"
                    >
                        <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => handleFeedback("negative")}
                        className={cn(
                            btnBase,
                            feedback === "negative" && "text-rose-500 hover:text-rose-600"
                        )}
                        title="Bad response"
                        aria-label="Bad response"
                    >
                        <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                </>
            )}

            {showRegen && (
                <>
                    <Separator orientation="vertical" className="h-3.5 mx-0.5" />
                    <button onClick={onRegenerate} className={btnBase} title="Regenerate" aria-label="Regenerate response">
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                </>
            )}
        </div>
    );
}
