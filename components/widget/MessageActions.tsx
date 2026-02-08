"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
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

    return (
        <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
                onClick={handleCopy}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                title="Copy message"
            >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {config.collectUserFeedback && (
                <>
                    <button
                        onClick={() => handleFeedback("positive")}
                        className={cn(
                            "p-1 rounded transition-colors",
                            feedback === "positive" ? "text-green-600" : "text-gray-400 hover:text-gray-600"
                        )}
                        title="Good response"
                    >
                        <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => handleFeedback("negative")}
                        className={cn(
                            "p-1 rounded transition-colors",
                            feedback === "negative" ? "text-red-600" : "text-gray-400 hover:text-gray-600"
                        )}
                        title="Bad response"
                    >
                        <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                </>
            )}

            {isLast && config.regenerateMessages && onRegenerate && (
                <button
                    onClick={onRegenerate}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                    title="Regenerate response"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}
