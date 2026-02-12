"use client";

import { useState, useCallback, useRef } from "react";
import { nanoid } from "nanoid";

export interface ChatMessage {
    id: string;
    role: "user" | "assistant" | "system" | "agent";
    content: string;
    createdAt: Date;
    status?: "sending" | "sent" | "streaming" | "delivered" | "error";
    responseId?: string;
    citations?: string[];
}

export type ChatStatus = "ready" | "submitted" | "streaming" | "error";

interface UseChatOptions {
    /**
     * Initial messages to populate the chat
     */
    initialMessages?: ChatMessage[];
    /**
     * Called when a message is submitted
     */
    onSubmit?: (message: string, messages: ChatMessage[]) => Promise<string | void>;
    /**
     * Called when streaming response is received
     */
    onStream?: (chunk: string, fullContent: string) => void;
    /**
     * Called when an error occurs
     */
    onError?: (error: Error) => void;
    /**
     * Simulated streaming delay in ms (for demo/testing)
     */
    streamDelay?: number;
}

interface UseChatReturn {
    /**
     * All messages in the conversation
     */
    messages: ChatMessage[];
    /**
     * Current status of the chat
     */
    status: ChatStatus;
    /**
     * Current input value
     */
    input: string;
    /**
     * Set the input value
     */
    setInput: (value: string) => void;
    /**
     * Send a message
     */
    sendMessage: (content?: string) => Promise<void>;
    /**
     * Add a message directly (for external sources like WebSocket)
     */
    addMessage: (message: Omit<ChatMessage, "id" | "createdAt">) => string;
    /**
     * Update a message by ID
     */
    updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
    /**
     * Append content to a streaming message
     */
    appendToMessage: (id: string, content: string) => void;
    /**
     * Clear all messages
     */
    clearMessages: () => void;
    /**
     * Set messages directly (for loading history)
     */
    setMessages: (messages: ChatMessage[]) => void;
    /**
     * Set the status
     */
    setStatus: (status: ChatStatus) => void;
    /**
     * Regenerate the last assistant message
     */
    regenerate: () => Promise<void>;
    /**
     * Stream a response word by word (for demo)
     */
    streamResponse: (content: string, messageId?: string) => Promise<string>;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
    const {
        initialMessages = [],
        onSubmit,
        onStream,
        onError,
        streamDelay = 50,
    } = options;

    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [status, setStatus] = useState<ChatStatus>("ready");
    const [input, setInput] = useState("");
    const streamingIdRef = useRef<string | null>(null);

    // Add a message
    const addMessage = useCallback((message: Omit<ChatMessage, "id" | "createdAt">) => {
        const newMessage: ChatMessage = {
            ...message,
            id: nanoid(),
            createdAt: new Date(),
        };
        setMessages((prev) => [...prev, newMessage]);
        return newMessage.id;
    }, []);

    // Update a message
    const updateMessage = useCallback((id: string, updates: Partial<ChatMessage>) => {
        setMessages((prev) =>
            prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
        );
    }, []);

    // Append content to a message (for streaming)
    const appendToMessage = useCallback((id: string, content: string) => {
        setMessages((prev) =>
            prev.map((msg) =>
                msg.id === id ? { ...msg, content: msg.content + content } : msg
            )
        );
    }, []);

    // Clear all messages
    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    // Stream a response word by word
    const streamResponse = useCallback(
        async (content: string, existingMessageId?: string): Promise<string> => {
            const messageId = existingMessageId || nanoid();
            streamingIdRef.current = messageId;

            // Create or find the message
            if (!existingMessageId) {
                const newMessage: ChatMessage = {
                    id: messageId,
                    role: "assistant",
                    content: "",
                    createdAt: new Date(),
                    status: "streaming",
                };
                setMessages((prev) => [...prev, newMessage]);
            } else {
                updateMessage(messageId, { content: "", status: "streaming" });
            }

            setStatus("streaming");

            // Stream word by word
            const words = content.split(" ");
            let currentContent = "";

            for (let i = 0; i < words.length; i++) {
                // Check if streaming was cancelled
                if (streamingIdRef.current !== messageId) break;

                currentContent += (i > 0 ? " " : "") + words[i];

                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === messageId ? { ...msg, content: currentContent } : msg
                    )
                );

                onStream?.(words[i], currentContent);

                // Small delay between words
                await new Promise((resolve) =>
                    setTimeout(resolve, Math.random() * streamDelay + streamDelay / 2)
                );
            }

            // Mark as delivered
            updateMessage(messageId, { status: "delivered" });
            setStatus("ready");
            streamingIdRef.current = null;

            return messageId;
        },
        [streamDelay, onStream, updateMessage]
    );

    // Send a message
    const sendMessage = useCallback(
        async (content?: string) => {
            const messageContent = content || input;
            if (!messageContent.trim()) return;

            // Clear input
            setInput("");
            setStatus("submitted");

            // Add user message
            const userMessage: ChatMessage = {
                id: nanoid(),
                role: "user",
                content: messageContent.trim(),
                createdAt: new Date(),
                status: "sent",
            };
            setMessages((prev) => [...prev, userMessage]);

            try {
                // Call onSubmit if provided
                if (onSubmit) {
                    const response = await onSubmit(messageContent, [...messages, userMessage]);

                    // If onSubmit returns a string, stream it as the response
                    if (typeof response === "string") {
                        await streamResponse(response);
                    }
                }
            } catch (error) {
                setStatus("error");
                onError?.(error instanceof Error ? error : new Error(String(error)));
            }
        },
        [input, messages, onSubmit, onError, streamResponse]
    );

    // Regenerate the last assistant message
    const regenerate = useCallback(async () => {
        // Find the last user message
        const lastUserIndex = [...messages].reverse().findIndex((m) => m.role === "user");
        if (lastUserIndex === -1) return;

        const realIndex = messages.length - 1 - lastUserIndex;
        const lastUserMessage = messages[realIndex];

        // Remove messages after the last user message
        setMessages((prev) => prev.slice(0, realIndex + 1));

        // Re-send the message
        try {
            if (onSubmit) {
                setStatus("submitted");
                const response = await onSubmit(lastUserMessage.content, messages.slice(0, realIndex + 1));
                if (typeof response === "string") {
                    await streamResponse(response);
                }
            }
        } catch (error) {
            setStatus("error");
            onError?.(error instanceof Error ? error : new Error(String(error)));
        }
    }, [messages, onSubmit, onError, streamResponse]);

    return {
        messages,
        status,
        input,
        setInput,
        sendMessage,
        addMessage,
        updateMessage,
        appendToMessage,
        clearMessages,
        setMessages,
        setStatus,
        regenerate,
        streamResponse,
    };
}
