"use client";

import { useEffect, useRef, useState } from "react";
import { SOUNDS } from "@/lib/config/sounds";
import type { Message } from "@/types/activity";

interface UseWidgetSoundProps {
    messages: Message[];
    isWidgetOpen: boolean;
    soundEnabled: boolean;
    soundUrl?: string;
}

export function useWidgetSound({
    messages,
    isWidgetOpen,
    soundEnabled,
    soundUrl
}: UseWidgetSoundProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastProcessedMessageId = useRef<string | null>(null);

    // Initialize audio
    useEffect(() => {
        audioRef.current = new Audio(soundUrl || SOUNDS.POPUP);
    }, [soundUrl]);

    // Monitor messages for sound triggers
    useEffect(() => {
        if (!messages.length) return;

        const lastMsg = messages[messages.length - 1];

        // Skip if not from agent/assistant
        if (lastMsg.role !== "assistant" && lastMsg.role !== "agent") return;

        const isNewId = lastProcessedMessageId.current !== lastMsg.id;

        if (isNewId) {
            // Check if message is recent (within last 5 seconds)
            // This prevents playing sound for history messages on load/remount
            const now = new Date();
            const msgTime = lastMsg.createdAt ? new Date(lastMsg.createdAt) : now;
            const isRecent = (now.getTime() - msgTime.getTime()) < 5000;

            // Play sound ONLY if:
            // 1. Widget is CLOSED (notification sound)
            // 2. Sound is enabled
            // 3. Message is recent (not history)
            if (!isWidgetOpen && soundEnabled !== false && isRecent) {
                audioRef.current?.play().catch(e => {
                    // console.error("Audio play failed", e);
                });
            }

            // Always update tracker
            lastProcessedMessageId.current = lastMsg.id;
        }
    }, [messages, isWidgetOpen, soundEnabled]);

    return {};
}
