import { useState, useRef, useCallback, useEffect } from "react"
import type { VoiceState, TranscriptMessage } from "@/types/config"
import type { LiveKitTokenResponse } from "@/types/voice.ts"
import type { Message } from "@/types/config"
import { generateVoiceToken } from "@/lib/api/voice"

interface UseVoiceCallOptions {
  chatbotId: string
  agentName?: string  // Optional: used for display purposes
}

interface UseVoiceCallReturn {
  // State
  voiceState: VoiceState
  callDuration: number
  transcript: TranscriptMessage[]
  isCallMinimized: boolean
  voiceConnection: LiveKitTokenResponse | null

  // Handlers
  handleStartCall: () => Promise<void>
  handleEndCall: () => void
  handleMinimizeCall: () => void
  handleExpandCall: () => void
  handleVoiceConnected: () => void
  handleVoiceDisconnected: () => void
  updateTranscript: (transcript: TranscriptMessage[]) => void

  // Helpers
  getTranscriptAsMessages: () => Message[]
  isCallActive: boolean
}

export function useVoiceCall({
  chatbotId,
}: UseVoiceCallOptions): UseVoiceCallReturn {
  // State
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [callDuration, setCallDuration] = useState(0)
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])
  const [isCallMinimized, setIsCallMinimized] = useState(false)
  const [voiceConnection, setVoiceConnection] = useState<LiveKitTokenResponse | null>(null)

  // Refs
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Derived state
  const isCallActive = voiceState === 'connecting' || voiceState === 'connected'

  // Call duration timer
  useEffect(() => {
    if (voiceState === 'connected') {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
        callTimerRef.current = null
      }
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
      }
    }
  }, [voiceState])

  // Start call - request token and initiate connection
  const handleStartCall = useCallback(async () => {
    setVoiceState('connecting')
    setCallDuration(0)
    setTranscript([])

    try {
      console.log("[Conversly Voice] Requesting voice token for chatbot:", chatbotId)
      const tokenResponse = await generateVoiceToken(chatbotId)

      console.log("[Conversly Voice] Voice token received:", {
        serverUrl: tokenResponse.serverUrl,
        roomName: tokenResponse.roomName,
        hasToken: !!tokenResponse.participantToken,
      })

      setVoiceConnection(tokenResponse)
      // Note: voiceState will be set to 'connected' by the LiveKit onConnected callback
    } catch (err) {
      console.error("[Conversly Voice] Failed to get voice token:", err)
      setVoiceState('idle')
      // TODO: Expose error state for UI to show toast
    }
  }, [chatbotId])

  // Called when LiveKit successfully connects
  const handleVoiceConnected = useCallback(() => {
    console.log("[Conversly Voice] Voice call connected")
    setVoiceState('connected')
  }, [])

  // Called when LiveKit disconnects
  const handleVoiceDisconnected = useCallback(() => {
    console.log("[Conversly Voice] Voice call disconnected")
    setVoiceState('disconnected')
    setIsCallMinimized(false)
    setVoiceConnection(null)

    // Reset voice state after a short delay
    setTimeout(() => {
      setVoiceState('idle')
      setCallDuration(0)
      setTranscript([])
    }, 100)
  }, [])

  // End call manually
  const handleEndCall = useCallback(() => {
    // This will trigger handleVoiceDisconnected via LiveKit
    // For direct disconnection handling
    handleVoiceDisconnected()
  }, [handleVoiceDisconnected])

  // Minimize call (show as pill)
  const handleMinimizeCall = useCallback(() => {
    setIsCallMinimized(true)
  }, [])

  // Expand call (show full view)
  const handleExpandCall = useCallback(() => {
    setIsCallMinimized(false)
  }, [])

  // Update transcript from LiveKit transcriptions
  const updateTranscript = useCallback((newTranscript: TranscriptMessage[]) => {
    setTranscript(newTranscript)
  }, [])

  // Convert transcript to chat messages
  const getTranscriptAsMessages = useCallback((): Message[] => {
    return transcript.map((t) => ({
      id: `voice-${t.id}`,
      role: t.role === 'user' ? 'user' as const : 'assistant' as const,
      content: t.content,
      createdAt: new Date(t.timestamp),
      source: 'voice' as const,
    }))
  }, [transcript])

  return {
    // State
    voiceState,
    callDuration,
    transcript,
    isCallMinimized,
    voiceConnection,

    // Handlers
    handleStartCall,
    handleEndCall,
    handleMinimizeCall,
    handleExpandCall,
    handleVoiceConnected,
    handleVoiceDisconnected,
    updateTranscript,

    // Helpers
    getTranscriptAsMessages,
    isCallActive,
  }
}

