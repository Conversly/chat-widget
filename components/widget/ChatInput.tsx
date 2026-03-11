"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { Send, Paperclip, Smile, Mic, Square } from "lucide-react"
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

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    onstart: (() => void) | null;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
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
    const [isRecording, setIsRecording] = useState(false)
    const [transcript, setTranscript] = useState("")
    const recognitionRef = useRef<SpeechRecognition | null>(null)

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

    // Initialize speech recognition
    const initSpeechRecognition = useCallback(() => {
        if (typeof window === "undefined") return null

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) {
            console.error("Speech recognition not supported in this browser")
            return null
        }

        const recognition = new SpeechRecognition()
        recognition.lang = "en-US"
        recognition.continuous = true
        recognition.interimResults = true
        recognition.maxAlternatives = 1

        recognition.onstart = () => {
            setIsRecording(true)
            setTranscript("")
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = ""
            let interimTranscript = ""

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i]
                if (result.isFinal) {
                    finalTranscript += result[0].transcript
                } else {
                    interimTranscript += result[0].transcript
                }
            }

            if (finalTranscript) {
                setTranscript((prevState: string) => prevState + finalTranscript)
                setInput(input + finalTranscript)
            } else if (interimTranscript) {
                // Show interim results temporarily
                const withoutInterim = input.replace(/\s+$/, "")
                setInput(withoutInterim + interimTranscript)
            }
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error("Speech recognition error:", event.error)
            setIsRecording(false)
        }

        recognition.onend = () => {
            setIsRecording(false)
            setTranscript("")
        }

        return recognition
    }, [setInput])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop()
            }
        }
    }, [])

    const handleVoiceClick = () => {
        if (isRecording) {
            // Stop recording
            if (recognitionRef.current) {
                recognitionRef.current.stop()
                recognitionRef.current = null
            }
            setIsRecording(false)
        } else {
            // Start recording
            const recognition = initSpeechRecognition()
            if (recognition) {
                recognitionRef.current = recognition
                try {
                    recognition.start()
                } catch (error) {
                    console.error("Failed to start speech recognition:", error)
                }
            } else {
                alert("Speech recognition is not supported in your browser. Please try using Chrome, Safari, or Edge.")
            }
        }
    }

    return (
        <div
            className={cn(
                "border-t pt-3 px-4 pb-2 bg-white",
                config.appearance === "dark" ? "border-gray-800 bg-gray-900" : "border-gray-100"
            )}
        >
            {/* Suggestions - Pills aligned to right */}
            {config.suggestedMessages &&
                config.suggestedMessages.filter((q: string) => q).length > 0 &&
                (config.continueSuggestedMessages || !hasUserMessages) && (
                    <div className="flex flex-wrap justify-end gap-2 mb-2">
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
                        "w-full px-3 py-2 border-0 bg-transparent resize-none outline-none text-[15px] leading-relaxed",
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
                            disabled={disabled}
                            title={isRecording ? "Stop recording" : "Voice input"}
                            className={cn(
                                "h-8 w-8 rounded-lg transition-all duration-200",
                                isRecording
                                    ? "bg-red-100 text-red-600 hover:bg-red-200 animate-pulse"
                                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                            )}
                        >
                            {isRecording ? (
                                <Square className="h-4 w-4 fill-current" />
                            ) : (
                                <Mic className="h-4 w-4" />
                            )}
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
