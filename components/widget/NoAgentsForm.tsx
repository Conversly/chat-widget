"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import type { WidgetConfig } from "@/types/chatbot";

interface StoredLead {
    name: string;
    email: string;
}

interface NoAgentsFormProps {
    config: WidgetConfig;
    onSubmit: (data: { name: string; email: string }) => Promise<void>;
    onDismiss: () => void;
    storedLead?: StoredLead | null;
}

export function NoAgentsForm({ config, onSubmit, onDismiss, storedLead }: NoAgentsFormProps) {
    const [formData, setFormData] = useState({ name: storedLead?.name || "", email: storedLead?.email || "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);

    useEffect(() => {
        if (storedLead?.name && storedLead?.email && !isAutoSubmitting) {
            setIsAutoSubmitting(true);
            setIsSubmitting(true);
            onSubmit({ name: storedLead.name, email: storedLead.email }).catch(() => {
                setIsSubmitting(false);
                setIsAutoSubmitting(false);
            });
        }
    }, [storedLead, onSubmit, isAutoSubmitting]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        const name = formData.name.trim();
        const email = formData.email.trim();

        if (!name) {
            setError("Please enter your name.");
            return;
        }

        if (!email) {
            setError("Please enter your email address.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({ name, email });
        } catch (err) {
            setError("Failed to submit. Please try again.");
            setIsSubmitting(false);
        }
    };

    const handleChange = (field: "name" | "email", value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Show confirmation state when auto-submitting with stored lead data
    if (storedLead?.name && storedLead?.email) {
        return (
            <div className="w-full space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">Contact Details Confirmed</span>
                </div>

                <p className="text-xs text-gray-500">
                    No support agent is online right now. We&apos;ll contact you at{" "}
                    <span className="font-medium text-gray-700">{storedLead.email}</span> as soon as an agent becomes available.
                </p>

                {isSubmitting ? (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Sending your details...</span>
                    </div>
                ) : error ? (
                    <p className="text-xs text-red-500">{error}</p>
                ) : null}
            </div>
        );
    }

    return (
        <div className="w-full space-y-3">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">No Agents Available</span>
            </div>

            <p className="text-xs text-gray-500 mb-3">
                No support agent is online right now. We will contact you later to resolve your query.
                Just drop your email and name.
            </p>

            <form onSubmit={handleSubmit} className="space-y-2">
                <div>
                    <input
                        type="text"
                        placeholder="Your name *"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-offset-0 transition-all bg-white"
                        style={{
                            // @ts-ignore variable styling
                            "--tw-ring-color": config.primaryColor || "#2D5A27"
                        }}
                    />
                </div>

                <div>
                    <input
                        type="email"
                        placeholder="Your email *"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-offset-0 transition-all bg-white"
                        style={{
                            // @ts-ignore variable styling
                            "--tw-ring-color": config.primaryColor || "#2D5A27"
                        }}
                    />
                </div>

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
