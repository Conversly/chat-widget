"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
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

    if (!leadForm) return null;

    const primaryColor = config.primaryColor || "#111111";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        for (const field of leadForm.fields) {
            const value = formData[field.id]?.trim();
            if (field.required && !value) {
                setError(`${field.label} is required.`);
                return;
            }
            if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                setError("Please enter a valid email address.");
                return;
            }
        }

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
        } catch {
            setError("Failed to submit. Please try again.");
            setIsSubmitting(false);
        }
    };

    const handleChange = (fieldId: string, value: string) => {
        setFormData(prev => ({ ...prev, [fieldId]: value }));
    };

    const inputClass =
        "w-full px-4 py-3.5 text-[15px] text-gray-900 border border-gray-200 rounded-2xl focus:outline-none focus:border-gray-400 transition-all bg-gray-50 placeholder:text-gray-400";

    return (
        <div className="absolute inset-0 z-50 flex flex-col justify-end overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60"
                onClick={onDismiss}
            />

            {/* Drawer */}
            <div className="relative bg-white rounded-t-3xl shadow-2xl px-6 pt-7 pb-8 animate-slide-up">
                {/* Drag handle */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-gray-200" />

                {/* Close button */}
                <button
                    type="button"
                    onClick={onDismiss}
                    className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Heading */}
                <div className="mb-6 pr-8">
                    <h2 className="text-[22px] font-bold text-gray-900 leading-tight">
                        {leadForm.title || "How can we contact you?"}
                    </h2>
                    {leadForm.subtitle && (
                        <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{leadForm.subtitle}</p>
                    )}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {leadForm.fields.sort((a, b) => a.position - b.position).map((field) => (
                        <div key={field.id}>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-0.5">*</span>}
                            </label>
                            {field.type === "textarea" ? (
                                <textarea
                                    placeholder={field.placeholder || field.label}
                                    value={formData[field.id] || ""}
                                    onChange={(e) => handleChange(field.id, e.target.value)}
                                    rows={3}
                                    className={cn(inputClass, "resize-none")}
                                />
                            ) : field.type === "select" ? (
                                <select
                                    value={formData[field.id] || ""}
                                    onChange={(e) => handleChange(field.id, e.target.value)}
                                    className={cn(inputClass, !formData[field.id] && "text-gray-400")}
                                >
                                    <option value="" disabled>{field.placeholder || field.label}</option>
                                    {field.options?.map((opt, idx) => (
                                        <option key={idx} value={opt} className="text-gray-900">{opt}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={field.type === "phone" ? "tel" : field.type}
                                    placeholder={field.placeholder || field.label}
                                    value={formData[field.id] || ""}
                                    onChange={(e) => handleChange(field.id, e.target.value)}
                                    className={inputClass}
                                />
                            )}
                        </div>
                    ))}

                    {error && (
                        <p className="text-xs text-red-500 flex items-center gap-1.5">
                            <span aria-hidden="true">⚠</span> {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 rounded-2xl text-white text-[15px] font-semibold mt-1 flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                        style={{ backgroundColor: primaryColor }}
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            leadForm.ctaText || "Submit"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
