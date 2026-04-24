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

    const inputClass = "w-full px-3 py-2 text-[13px] text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-400 transition-all bg-white placeholder:text-gray-400";

    return (
        <div className="w-full space-y-3">
            <div>
                <p className="text-sm font-semibold text-gray-900 leading-snug">{leadForm.title || "Contact Details"}</p>
                {leadForm.subtitle && (
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{leadForm.subtitle}</p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-2.5">
                {leadForm.fields.sort((a, b) => a.position - b.position).map((field) => {
                    const label = (
                        <label htmlFor={`lead-${field.id}`} className="block text-[11px] font-medium text-gray-600 mb-1">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-0.5">*</span>}
                        </label>
                    );
                    const placeholder = field.placeholder || field.label;

                    return (
                        <div key={field.id}>
                            {label}
                            {field.type === 'textarea' ? (
                                <textarea
                                    id={`lead-${field.id}`}
                                    placeholder={placeholder}
                                    value={formData[field.id] || ""}
                                    onChange={(e) => handleChange(field.id, e.target.value)}
                                    className={cn(inputClass, "resize-none")}
                                    rows={3}
                                />
                            ) : field.type === 'select' ? (
                                <select
                                    id={`lead-${field.id}`}
                                    value={formData[field.id] || ""}
                                    onChange={(e) => handleChange(field.id, e.target.value)}
                                    className={cn(inputClass, !formData[field.id] && "text-gray-400")}
                                >
                                    <option value="" disabled>{placeholder}</option>
                                    {field.options?.map((opt, idx) => (
                                        <option key={idx} value={opt} className="text-gray-900">{opt}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    id={`lead-${field.id}`}
                                    type={field.type === 'phone' ? 'tel' : field.type}
                                    placeholder={placeholder}
                                    value={formData[field.id] || ""}
                                    onChange={(e) => handleChange(field.id, e.target.value)}
                                    className={inputClass}
                                />
                            )}
                        </div>
                    );
                })}

                {error && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                        <span aria-hidden="true">⚠</span> {error}
                    </p>
                )}

                <div className="flex gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
                    >
                        Dismiss
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-2 px-3 rounded-lg text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                        style={{ backgroundColor: config.primaryColor || "#111111" }}
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            leadForm.ctaText || "Submit"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
