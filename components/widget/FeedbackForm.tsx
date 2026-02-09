"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
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
        <form onSubmit={handleSubmit} className="space-y-3 w-full max-w-[280px]">
            <div>
                <label
                    htmlFor="positive-feedback"
                    className={cn(
                        "text-xs mb-1.5 block font-medium",
                        isDark ? "text-gray-300" : "text-gray-700"
                    )}
                >
                    What did you like? (optional)
                </label>
                <input
                    id="positive-feedback"
                    type="text"
                    placeholder="Tell us what worked well..."
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    className={cn(
                        "w-full px-3 py-2 text-xs border rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all",
                        isDark
                            ? "bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:ring-gray-600"
                            : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-primary"
                    )}
                    style={!isDark ? { "--tw-ring-color": config.primaryColor } as any : undefined}
                />
            </div>

            <div className="flex justify-end gap-2">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className={cn(
                            "px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
                            isDark
                                ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                                : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-3 py-1.5 rounded-md text-white text-xs font-medium transition-opacity flex items-center justify-center min-w-[60px]"
                    style={{ backgroundColor: config.primaryColor || "#2D5A27" }}
                >
                    {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Submit"}
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

    const CheckboxItem = ({
        id,
        checked,
        onChange,
        label
    }: {
        id: string;
        checked: boolean;
        onChange: (checked: boolean) => void;
        label: string;
    }) => (
        <div className="flex items-center space-x-2">
            <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                style={{ color: config.primaryColor }}
            />
            <label
                htmlFor={id}
                className={cn(
                    "text-xs cursor-pointer select-none",
                    isDark ? "text-gray-300" : "text-gray-700"
                )}
            >
                {label}
            </label>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-3 w-full max-w-[280px]">
            <div>
                <label
                    htmlFor="negative-feedback"
                    className={cn(
                        "text-xs mb-1.5 block font-medium",
                        isDark ? "text-gray-300" : "text-gray-700"
                    )}
                >
                    What went wrong? (optional)
                </label>
                <input
                    id="negative-feedback"
                    type="text"
                    placeholder="Tell us what could be better..."
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    className={cn(
                        "w-full px-3 py-2 text-xs border rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all",
                        isDark
                            ? "bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:ring-gray-600"
                            : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-primary"
                    )}
                    style={!isDark ? { "--tw-ring-color": config.primaryColor } as any : undefined}
                />
            </div>

            <div className="space-y-2">
                <CheckboxItem
                    id="incorrect"
                    checked={incorrect}
                    onChange={setIncorrect}
                    label="Incorrect information"
                />
                <CheckboxItem
                    id="irrelevant"
                    checked={irrelevant}
                    onChange={setIrrelevant}
                    label="Irrelevant response"
                />
                <CheckboxItem
                    id="unaddressed"
                    checked={unaddressed}
                    onChange={setUnaddressed}
                    label="Question not fully addressed"
                />
            </div>

            <div className="flex justify-end gap-2 pt-1">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className={cn(
                            "px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
                            isDark
                                ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                                : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-3 py-1.5 rounded-md text-white text-xs font-medium transition-opacity flex items-center justify-center min-w-[60px]"
                    style={{ backgroundColor: config.primaryColor || "#2D5A27" }}
                >
                    {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Submit"}
                </button>
            </div>
        </form>
    );
}
