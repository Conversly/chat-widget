"use client";

import { useState } from "react";
import { Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetConfig } from "@/types/chatbot";

export interface PositiveFeedbackData {
    issue: string;
}

interface PositiveFeedbackFormProps {
    config: WidgetConfig;
    onSubmit: (data: PositiveFeedbackData) => Promise<void>;
    onCancel?: () => void;
}

function FeedbackHeader({
    config,
    type,
    isDark,
}: {
    config: WidgetConfig;
    type: "positive" | "negative";
    isDark: boolean;
}) {
    const avatarSrc = config.brandLogo;
    const isPositive = type === "positive";
    const brandInitial = (config.brandName || config.botName || "A").charAt(0).toUpperCase();

    return (
        <div className="flex items-center gap-2.5 mb-3">
            {/* Bot avatar / brand logo — uses brandLogo to match the widget header */}
            <div
                className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-offset-1",
                    isDark ? "ring-offset-gray-900" : "ring-offset-white",
                    isPositive
                        ? "ring-emerald-200 bg-emerald-50"
                        : "ring-orange-200 bg-orange-50"
                )}
            >
                {avatarSrc ? (
                    <img
                        src={avatarSrc}
                        alt={config.brandName || "Bot"}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span
                        className={cn(
                            "text-xs font-bold",
                            isPositive ? "text-emerald-600" : "text-orange-600"
                        )}
                    >
                        {brandInitial}
                    </span>
                )}
            </div>

            {/* Title + subtitle */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    {isPositive ? (
                        <ThumbsUp className="w-3 h-3 text-emerald-500" />
                    ) : (
                        <ThumbsDown className="w-3 h-3 text-orange-500" />
                    )}
                    <span
                        className={cn(
                            "text-xs font-semibold tracking-tight",
                            isDark ? "text-gray-100" : "text-gray-800"
                        )}
                    >
                        {isPositive ? "Glad you liked it!" : "Help us improve"}
                    </span>
                </div>
                <p
                    className={cn(
                        "text-[10px] leading-tight mt-0.5",
                        isDark ? "text-gray-500" : "text-gray-400"
                    )}
                >
                    {isPositive
                        ? "Your feedback helps us get better."
                        : "Let us know what went wrong."}
                </p>
            </div>
        </div>
    );
}

export function PositiveFeedbackForm({
    config,
    onSubmit,
    onCancel,
}: PositiveFeedbackFormProps) {
    const [issue, setIssue] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit({ issue });
            setIssue("");
        } catch (error) {
            console.error("Failed to submit feedback", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isDark = config.appearance === "dark";

    return (
        <form
            onSubmit={handleSubmit}
            className={cn(
                "w-full rounded-xl p-3 space-y-3 transition-all duration-200",
                isDark
                    ? "bg-gray-800/60 border border-gray-700/50"
                    : "bg-gradient-to-b from-emerald-50/60 to-white border border-emerald-100/80"
            )}
        >
            <FeedbackHeader config={config} type="positive" isDark={isDark} />

            <div>
                <label
                    htmlFor="positive-feedback"
                    className={cn(
                        "text-[11px] mb-1.5 block font-medium",
                        isDark ? "text-gray-400" : "text-gray-500"
                    )}
                >
                    What did you like? <span className="font-normal opacity-70">(optional)</span>
                </label>
                <textarea
                    id="positive-feedback"
                    placeholder="Tell us what worked well..."
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    rows={2}
                    className={cn(
                        "w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-30 transition-all resize-none",
                        isDark
                            ? "bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:ring-gray-500 focus:border-gray-600"
                            : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-emerald-300"
                    )}
                    style={
                        !isDark
                            ? ({ "--tw-ring-color": config.primaryColor + "40" } as any)
                            : undefined
                    }
                />
            </div>

            <div className="flex items-center justify-end gap-2 pt-0.5">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className={cn(
                            "px-3.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150",
                            isDark
                                ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        )}
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                        "px-4 py-1.5 rounded-lg text-white text-[11px] font-semibold transition-all duration-150 flex items-center justify-center min-w-[72px] shadow-sm",
                        isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:shadow-md hover:brightness-110 active:scale-[0.97]"
                    )}
                    style={{ backgroundColor: config.primaryColor || "#2D5A27" }}
                >
                    {isSubmitting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        "Submit"
                    )}
                </button>
            </div>
        </form>
    );
}

export interface NegativeFeedbackData {
    issue: string;
    incorrect: boolean;
    irrelevant: boolean;
    unaddressed: boolean;
}

interface NegativeFeedbackFormProps {
    config: WidgetConfig;
    onSubmit: (data: NegativeFeedbackData) => Promise<void>;
    onCancel?: () => void;
}

export function NegativeFeedbackForm({
    config,
    onSubmit,
    onCancel,
}: NegativeFeedbackFormProps) {
    const [issue, setIssue] = useState("");
    const [incorrect, setIncorrect] = useState(false);
    const [irrelevant, setIrrelevant] = useState(false);
    const [unaddressed, setUnaddressed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit({ issue, incorrect, irrelevant, unaddressed });
            // Reset form
            setIssue("");
            setIncorrect(false);
            setIrrelevant(false);
            setUnaddressed(false);
        } catch (error) {
            console.error("Failed to submit feedback", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isDark = config.appearance === "dark";

    const issueOptions = [
        { id: "incorrect", checked: incorrect, onChange: setIncorrect, label: "Incorrect information", emoji: "❌" },
        { id: "irrelevant", checked: irrelevant, onChange: setIrrelevant, label: "Irrelevant response", emoji: "🎯" },
        { id: "unaddressed", checked: unaddressed, onChange: setUnaddressed, label: "Question not fully addressed", emoji: "❓" },
    ];

    return (
        <form
            onSubmit={handleSubmit}
            className={cn(
                "w-full rounded-xl p-3 space-y-3 transition-all duration-200",
                isDark
                    ? "bg-gray-800/60 border border-gray-700/50"
                    : "bg-gradient-to-b from-orange-50/50 to-white border border-orange-100/80"
            )}
        >
            <FeedbackHeader config={config} type="negative" isDark={isDark} />

            {/* Quick issue chips */}
            <div className="flex flex-wrap gap-1.5">
                {issueOptions.map((opt) => (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => opt.onChange(!opt.checked)}
                        className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-150 border cursor-pointer select-none",
                            opt.checked
                                ? isDark
                                    ? "border-orange-400/50 bg-orange-500/20 text-orange-300"
                                    : "border-orange-300 bg-orange-50 text-orange-700 shadow-sm"
                                : isDark
                                    ? "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-300"
                                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:shadow-sm"
                        )}
                    >
                        <span className="text-[10px]">{opt.emoji}</span>
                        {opt.label}
                    </button>
                ))}
            </div>

            <div>
                <label
                    htmlFor="negative-feedback"
                    className={cn(
                        "text-[11px] mb-1.5 block font-medium",
                        isDark ? "text-gray-400" : "text-gray-500"
                    )}
                >
                    Tell us more <span className="font-normal opacity-70">(optional)</span>
                </label>
                <textarea
                    id="negative-feedback"
                    placeholder="What could be improved..."
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    rows={2}
                    className={cn(
                        "w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-30 transition-all resize-none",
                        isDark
                            ? "bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:ring-gray-500 focus:border-gray-600"
                            : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-orange-200"
                    )}
                    style={
                        !isDark
                            ? ({ "--tw-ring-color": config.primaryColor + "40" } as any)
                            : undefined
                    }
                />
            </div>

            <div className="flex items-center justify-end gap-2 pt-0.5">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className={cn(
                            "px-3.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150",
                            isDark
                                ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        )}
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                        "px-4 py-1.5 rounded-lg text-white text-[11px] font-semibold transition-all duration-150 flex items-center justify-center min-w-[72px] shadow-sm",
                        isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:shadow-md hover:brightness-110 active:scale-[0.97]"
                    )}
                    style={{ backgroundColor: config.primaryColor || "#2D5A27" }}
                >
                    {isSubmitting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        "Submit"
                    )}
                </button>
            </div>
        </form>
    );
}
