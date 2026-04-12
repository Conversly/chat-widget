"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetConfig } from "@/types/chatbot";

interface SuggestionChipsProps {
  config: WidgetConfig;
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  /** Disable chips while a response is in-flight */
  disabled?: boolean;
}

/**
 * Renders a set of clickable query-refinement chips emitted by the backend's
 * `suggestions` stream event. The chips sit below the assistant bubble and
 * re-fire the selected query as a normal user message so the next request goes
 * straight to full RAG + generation (no suggestions loop).
 */
export function SuggestionChips({
  config,
  suggestions,
  onSelect,
  disabled = false,
}: SuggestionChipsProps) {
  if (!suggestions || suggestions.length === 0) return null;

  const isDark = config.appearance === "dark";

  return (
    <div className="px-4 pt-2 pb-1">
      {/* Header label */}
      <div
        className={cn(
          "flex items-center gap-1.5 mb-2 text-[11px] font-medium tracking-wide uppercase",
          isDark ? "text-gray-500" : "text-gray-400"
        )}
      >
        <Sparkles className="w-3 h-3" />
        <span>Did you mean?</span>
      </div>

      {/* Chip list */}
      <div className="flex flex-col gap-2">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => !disabled && onSelect(suggestion)}
            disabled={disabled}
            className={cn(
              // Base pill styles
              "group relative flex items-center gap-2.5 w-full text-left",
              "px-4 py-2.5 rounded-xl border text-sm font-medium",
              "transition-all duration-150 ease-in-out",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
              // Disabled
              disabled && "opacity-50 cursor-not-allowed",
              // Light mode
              !isDark &&
                "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm active:scale-[0.99]",
              // Dark mode
              isDark &&
                "bg-gray-800 border-gray-700 text-gray-200 hover:border-gray-600 hover:bg-gray-750 active:scale-[0.99]"
            )}
            style={
              !disabled
                ? {
                    // Subtle left accent using the bot primary color
                    borderLeftColor: config.primaryColor,
                    borderLeftWidth: "3px",
                  }
                : undefined
            }
          >
            {/* Numbered badge */}
            <span
              className={cn(
                "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white",
                "transition-transform duration-150 group-hover:scale-105"
              )}
              style={{ backgroundColor: config.primaryColor }}
            >
              {idx + 1}
            </span>

            {/* Suggestion text */}
            <span className="flex-1 leading-snug">{suggestion}</span>

            {/* Arrow indicator */}
            <svg
              className={cn(
                "w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150",
                isDark ? "text-gray-400" : "text-gray-400"
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
