"use client"

import { useRef } from "react"
import { Send, Paperclip, Smile, Mic } from "lucide-react"
import type { WidgetConfig } from "@/types/chatbot";
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAutosizeTextArea } from "@/hooks/use-autosize-textarea"

interface ChatInputProps {
    config: WidgetConfig
    input: string
    setInput: (input: string) => void
    handleSendMessage: (content: string) => void
    handleSuggestionClick: (suggestion: string) => void
    hasUserMessages?: boolean
    disabled?: boolean
}

export function ChatInput({
    config,
    input,
    setInput,
    handleSendMessage,
    handleSuggestionClick,
    hasUserMessages = false,
    disabled = false,
}: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Auto-resize textarea, max ~3x original height (36px base -> 108px max)
    useAutosizeTextArea({
        ref: textareaRef,
        maxHeight: 120, // Increased specificily for rich input
        dependencies: [input],
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (input.trim() && !disabled) {
            handleSendMessage(input)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    const handleFileSelect = () => {
        console.log("File select clicked - Feature coming soon")
        // Trigger hidden file input if implemented
    }

    const handleVoiceClick = () => {
        console.log("Voice click - Feature coming soon")
    }

    return (
        <div
            className={cn(
                "border-t p-4 bg-white",
                config.appearance === "dark" ? "border-gray-800 bg-gray-900" : "border-gray-100"
            )}
        >
            {/* Suggestions - Pills aligned to right */}
            {config.suggestedMessages &&
                config.suggestedMessages.filter((q: string) => q).length > 0 &&
                (config.continueSuggestedMessages || !hasUserMessages) && (
                    <div className="flex flex-wrap justify-end gap-2 mb-4">
                        {config.suggestedMessages
                            .filter((q: string) => q)
                            .map((question: string, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSuggestionClick(question)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                                        config.appearance === "dark"
                                            ? "bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
                                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900"
                                    )}
                                >
                                    {question}
                                </button>
                            ))}
                    </div>
                )}

            {/* Powered By Text (Above Input) */}
            {config.showPoweredBy && (
                <div className="flex justify-center mb-2">
                    <div
                        className={cn(
                            "text-[11px] font-medium opacity-60 flex items-center gap-1",
                            config.appearance === "dark" ? "text-gray-400" : "text-gray-500"
                        )}
                    >
                        Powered by <span className="font-semibold">{config.brandName || "Verly"}</span>
                    </div>
                </div>
            )}

            {/* Input Section - Cal.com Style */}
            <form
                onSubmit={handleSubmit}
                className={cn(
                    "flex flex-col border rounded-xl overflow-hidden transition-shadow focus-within:ring-1 focus-within:ring-black/10 shadow-sm",
                    config.appearance === "dark"
                        ? "bg-gray-800 border-gray-700 focus-within:ring-white/10"
                        : "bg-white border-gray-200"
                )}
            >
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={config.placeholder || "Message..."}
                    rows={1}
                    disabled={disabled}
                    className={cn(
                        "w-full px-3 py-3 border-0 bg-transparent resize-none outline-none text-[15px] leading-relaxed",
                        config.appearance === "dark"
                            ? "text-white placeholder:text-gray-500"
                            : "text-gray-900 placeholder:text-gray-400"
                    )}
                />

                {/* Toolbar */}
                <div className="flex items-center justify-between px-2 pb-2">
                    {/* Left Actions: Attach & Emoji */}
                    <div className="flex items-center gap-0.5 shrink-0 mb-0.5 ml-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleFileSelect}
                            className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            disabled={disabled}
                            title="Attach file"
                        >
                            <Paperclip className="h-4 w-4" />
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            disabled={disabled}
                            title="Add emoji"
                        >
                            <Smile className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleVoiceClick}
                            className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            disabled={disabled}
                            title="Voice input"
                        >
                            <Mic className="h-4 w-4" />
                        </Button>

                        <Button
                            type="submit"
                            size="icon"
                            disabled={!input.trim() || disabled}
                            className={cn(
                                "h-8 w-8 rounded-full transition-all duration-200 flex items-center justify-center",
                                config.appearance === "dark"
                                    ? "bg-white text-black hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-600"
                                    : "bg-black text-white hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
                            )}
                        >
                            <Send className="h-4 w-4 ml-0.5" />
                        </Button>
                    </div>
                </div>
            </form>

            {/* Footer Text Removed (Moved Top) */}
        </div>
    )
}
