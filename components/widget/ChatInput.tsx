"use client"

import { useRef, useState, useEffect } from "react"
import { Send, Paperclip, Smile, Mic, Square } from "lucide-react"
import type { WidgetConfig } from "@/types/chatbot";
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
    isStreaming?: boolean
    onInterrupt?: () => Promise<void>
    isInterrupting?: boolean
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

const EMOJI_LIST = [
    "😊","😂","❤️","👍","🙏","😍","😭","😅","🤔","😎",
    "👋","🎉","🔥","💯","✅","🚀","💡","🤝","😢","😡",
    "🙄","😮","🥰","🤣","👏","💪","🎯","⭐","💬","📝",
    "😴","🤯","🥳","😬","🫡","🤭","😏","🫶","🙃","😤",
    "👌","✌️","🤞","🫂","💥","🎊","🌟","🏆","📌","🔑",
]

export function ChatInput({
    config,
    input,
    setInput,
    handleSendMessage,
    handleSuggestionClick,
    hasUserMessages = false,
    disabled = false,
    isStreaming = false,
    onInterrupt,
    isInterrupting = false,
}: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [isRecording, setIsRecording] = useState(false)
    const recognitionRef = useRef<SpeechRecognition | null>(null)
    // Tracks confirmed text before + during the current recording session
    const baseInputRef = useRef("")
    const [emojiOpen, setEmojiOpen] = useState(false)

    useAutosizeTextArea({
        ref: textareaRef,
        maxHeight: 120,
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

    const handleEmojiSelect = (emoji: string) => {
        const ta = textareaRef.current
        if (ta) {
            const start = ta.selectionStart ?? input.length
            const end = ta.selectionEnd ?? input.length
            const next = input.slice(0, start) + emoji + input.slice(end)
            setInput(next)
            // Restore cursor after emoji
            requestAnimationFrame(() => {
                ta.focus()
                ta.setSelectionRange(start + emoji.length, start + emoji.length)
            })
        } else {
            setInput(input + emoji)
        }
        setEmojiOpen(false)
    }

    const startRecording = () => {
        if (typeof window === "undefined") return
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in your browser. Please try Chrome, Safari, or Edge.")
            return
        }

        const recognition = new SpeechRecognition()
        recognition.lang = "en-US"
        recognition.continuous = true
        recognition.interimResults = true
        recognition.maxAlternatives = 1

        // Capture current input as the base text for this recording session
        baseInputRef.current = input

        recognition.onstart = () => setIsRecording(true)

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
                // Append finalised speech to the base, then make it the new base
                const sep = baseInputRef.current && !baseInputRef.current.endsWith(" ") ? " " : ""
                baseInputRef.current = baseInputRef.current + sep + finalTranscript.trim()
                setInput(baseInputRef.current)
            } else if (interimTranscript) {
                // Show live interim text on top of the confirmed base
                const sep = baseInputRef.current && !baseInputRef.current.endsWith(" ") ? " " : ""
                setInput(baseInputRef.current + sep + interimTranscript)
            }
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error("Speech recognition error:", event.error)
            setIsRecording(false)
        }

        recognition.onend = () => setIsRecording(false)

        recognitionRef.current = recognition
        try {
            recognition.start()
        } catch (error) {
            console.error("Failed to start speech recognition:", error)
        }
    }

    const stopRecording = () => {
        recognitionRef.current?.stop()
        recognitionRef.current = null
        setIsRecording(false)
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => { recognitionRef.current?.stop() }
    }, [])

    return (
        <div
            className={cn(
                "border-t pt-2.5 px-3 pb-2.5",
                config.appearance === "dark" ? "border-gray-800 bg-gray-900" : "border-gray-100 bg-white"
            )}
        >
            {/* Suggestion pills */}
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

            {/* Input box */}
            <form
                onSubmit={handleSubmit}
                className={cn(
                    "flex flex-col border rounded-2xl overflow-hidden transition-all duration-150 focus-within:ring-2 focus-within:ring-black/8 focus-within:border-gray-300 shadow-sm",
                    config.appearance === "dark"
                        ? "bg-gray-800 border-gray-700 focus-within:ring-white/10 focus-within:border-gray-600"
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
                        "w-full px-4 pt-3 pb-1 border-0 bg-transparent resize-none outline-none text-[14px] leading-relaxed",
                        config.appearance === "dark"
                            ? "text-white placeholder:text-gray-500"
                            : "text-gray-900 placeholder:text-gray-400"
                    )}
                />

                {/* Toolbar */}
                <div className="flex items-center justify-between px-3 pb-3 pt-1">
                    {/* Left: Attach + Emoji */}
                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => console.log("Attach file — coming soon")}
                            className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                            disabled={disabled}
                            title="Attach file"
                        >
                            <Paperclip className="h-4 w-4" />
                        </Button>

                        <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-8 w-8 rounded-lg transition-colors",
                                        emojiOpen
                                            ? "bg-gray-100 text-gray-700"
                                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                    )}
                                    disabled={disabled}
                                    title="Add emoji"
                                >
                                    <Smile className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                side="top"
                                align="start"
                                className="w-64 p-2 shadow-lg border border-gray-100 rounded-2xl"
                            >
                                <div className="grid grid-cols-10 gap-0.5">
                                    {EMOJI_LIST.map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => handleEmojiSelect(emoji)}
                                            className="flex items-center justify-center h-7 w-full text-lg rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Right: Mic + Send/Stop */}
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={disabled}
                            title={isRecording ? "Stop recording" : "Voice input"}
                            className={cn(
                                "h-8 w-8 rounded-full transition-all duration-200",
                                isRecording
                                    ? "bg-gray-900 text-white hover:bg-black"
                                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            )}
                        >
                            {isRecording
                                ? <Square className="h-3.5 w-3.5 fill-current" />
                                : <Mic className="h-4 w-4" />
                            }
                        </Button>

                        {isStreaming && onInterrupt ? (
                            <Button
                                type="button"
                                size="icon"
                                onClick={onInterrupt}
                                disabled={isInterrupting}
                                className={cn(
                                    "h-8 w-8 rounded-full transition-all duration-200",
                                    "bg-gray-900 text-white hover:bg-black disabled:opacity-50",
                                    isInterrupting && "opacity-60"
                                )}
                                title="Stop response"
                            >
                                <Square className="h-3.5 w-3.5 fill-current" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!input.trim() || disabled}
                                style={input.trim() && !disabled && config.primaryColor ? { backgroundColor: config.primaryColor } : undefined}
                                className={cn(
                                    "h-8 w-8 rounded-full transition-all duration-200",
                                    config.appearance === "dark"
                                        ? "bg-white text-black hover:bg-gray-100 disabled:bg-gray-700 disabled:text-gray-500"
                                        : "bg-gray-900 text-white hover:bg-black disabled:bg-gray-200 disabled:text-gray-400"
                                )}
                            >
                                <Send className="h-3.5 w-3.5 translate-x-px" />
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    )
}
