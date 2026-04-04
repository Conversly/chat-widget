"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetConfig } from "@/types/chatbot";

import type { LeadForm } from "@/types/lead-forms";

interface LeadGenerationFormProps {
    config: WidgetConfig;
    leadForm: LeadForm | null;
    onSubmit: (data: Record<string, any>) => Promise<void>;
    onDismiss: () => void;
}

export function LeadGenerationForm({ config, leadForm, onSubmit, onDismiss }: LeadGenerationFormProps) {
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // If no lead form config is provided, don't render anything (or could render legacy form if needed)
    if (!leadForm) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        for (const field of leadForm.fields) {
            const value = formData[field.id]?.trim();
            if (field.required && !value) {
                setError(`${field.label} is required.`);
                return;
            }
            if (field.type === 'email' && value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    setError(`Please enter a valid email for ${field.label}.`);
                    return;
                }
            }
        }

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
        } catch (err) {
            setError("Failed to submit. Please try again.");
            setIsSubmitting(false);
        }
    };

    const handleChange = (fieldId: string, value: string) => {
        setFormData(prev => ({ ...prev, [fieldId]: value }));
    };

    return (
        <div className="w-full space-y-3">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{leadForm.title || "Contact Details"}</span>
            </div>

            {leadForm.subtitle && (
                <p className="text-xs text-gray-500 mb-2">
                    {leadForm.subtitle}
                </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-2">
                {leadForm.fields.sort((a, b) => a.position - b.position).map((field) => (
                    <div key={field.id}>
                        {field.type === 'textarea' ? (
                            <textarea
                                placeholder={field.placeholder || field.label + (field.required ? " *" : "")}
                                value={formData[field.id] || ""}
                                onChange={(e) => handleChange(field.id, e.target.value)}
                                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-offset-0 transition-all bg-white resize-none"
                                rows={3}
                                style={{
                                    // @ts-ignore variable styling
                                    "--tw-ring-color": config.primaryColor || "#2D5A27"
                                }}
                            />
                        ) : field.type === 'select' ? (
                            <select
                                value={formData[field.id] || ""}
                                onChange={(e) => handleChange(field.id, e.target.value)}
                                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-offset-0 transition-all bg-white"
                                style={{
                                    // @ts-ignore variable styling
                                    "--tw-ring-color": config.primaryColor || "#2D5A27"
                                }}
                            >
                                <option value="" disabled>
                                    {field.placeholder || field.label + (field.required ? " *" : "")}
                                </option>
                                {field.options?.map((opt, idx) => (
                                    <option key={idx} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type={field.type === 'phone' ? 'tel' : field.type}
                                placeholder={field.placeholder || field.label + (field.required ? " *" : "")}
                                value={formData[field.id] || ""}
                                onChange={(e) => handleChange(field.id, e.target.value)}
                                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-offset-0 transition-all bg-white"
                                style={{
                                    // @ts-ignore variable styling
                                    "--tw-ring-color": config.primaryColor || "#2D5A27"
                                }}
                            />
                        )}
                    </div>
                ))}

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
                            leadForm.ctaText || "Submit"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
