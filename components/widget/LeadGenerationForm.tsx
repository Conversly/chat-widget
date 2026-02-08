"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetConfig } from "@/types/chatbot";

interface LeadGenerationFormProps {
    config: WidgetConfig;
    onSubmit: (data: { name: string; email: string; phone?: string }) => Promise<void>;
    onDismiss: () => void;
}

export function LeadGenerationForm({ config, onSubmit, onDismiss }: LeadGenerationFormProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim() || !email.trim()) {
            setError("Name and Email are required.");
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({ name, email, phone: phone || undefined });
        } catch (err) {
            setError("Failed to submit. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-[280px] space-y-3">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Contact Details</span>
            </div>

            <p className="text-xs text-gray-500 mb-2">
                Please provide your details to continue.
            </p>

            <form onSubmit={handleSubmit} className="space-y-2">
                <input
                    type="text"
                    placeholder="Name *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-offset-0 transition-all bg-white"
                    style={{
                        // @ts-ignore variable styling
                        "--tw-ring-color": config.primaryColor || "#2D5A27"
                    }}
                />
                <input
                    type="email"
                    placeholder="Email *"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-offset-0 transition-all bg-white"
                    style={{
                        // @ts-ignore variable styling
                        "--tw-ring-color": config.primaryColor || "#2D5A27"
                    }}
                />
                <input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-offset-0 transition-all bg-white"
                    style={{
                        // @ts-ignore variable styling
                        "--tw-ring-color": config.primaryColor || "#2D5A27"
                    }}
                />

                {error && (
                    <p className="text-xs text-red-500">{error}</p>
                )}

                <div className="flex gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="flex-1 py-1.5 px-3 rounded-md text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        Dismiss
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-1.5 px-3 rounded-md text-white text-xs font-medium transition-opacity flex items-center justify-center gap-1.5"
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
        </div>
    );
}
