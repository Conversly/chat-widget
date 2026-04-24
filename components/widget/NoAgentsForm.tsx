"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import type { WidgetConfig } from "@/types/chatbot";
import { UI_TEXT } from "@/lib/constants";

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

        const { fields, validation } = UI_TEXT.noAgentsForm;

        // Validation
        const name = formData.name.trim();
        const email = formData.email.trim();

        if (!name) {
            setError(fields.name.validationMessage);
            return;
        }

        if (!email) {
            setError(fields.email.validationMessage);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError(validation.invalidEmail);
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({ name, email });
        } catch (err) {
            setError(validation.submitError);
            setIsSubmitting(false);
        }
    };

    const handleChange = (field: "name" | "email", value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const { noAgentsForm } = UI_TEXT;

    // Show confirmation state when auto-submitting with stored lead data
    if (storedLead?.name && storedLead?.email) {
        return (
            <div className="w-full space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">{noAgentsForm.confirmationTitle}</span>
                </div>

                <p className="text-xs text-gray-500">
                    {noAgentsForm.confirmationMessage(storedLead.email)}
                </p>

                {isSubmitting ? (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>{noAgentsForm.submittingText}</span>
                    </div>
                ) : error ? (
                    <p className="text-xs text-red-500">{error}</p>
                ) : null}
            </div>
        );
    }

    const { fields, buttons } = noAgentsForm;

    return (
        <div className="w-full space-y-3">
            <div>
                <p className="text-[13px] font-semibold text-gray-900">{noAgentsForm.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{noAgentsForm.description}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2">
                <input
                    type={fields.name.type}
                    placeholder={fields.name.placeholder}
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400"
                />
                <input
                    type={fields.email.type}
                    placeholder={fields.email.placeholder}
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400"
                />

                {error && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                        <span>⚠</span> {error}
                    </p>
                )}

                <div className="flex gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                    >
                        {buttons.dismiss}
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-2 px-3 rounded-xl text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                        style={{ backgroundColor: config.primaryColor || "#111111" }}
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            buttons.submit
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
