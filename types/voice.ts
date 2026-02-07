export type VoiceState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export interface TranscriptMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface VoiceProviderSettings {
    // ElevenLabs
    stability?: number;           // 0-1
    similarityBoost?: number;     // 0-1
    style?: number;               // 0-1
    useSpeakerBoost?: boolean;

    // Cartesia & OpenAI TTS & Google
    speed?: number;               // Cartesia: -1 to 1, OpenAI/Google: 0.25 to 4.0
    emotion?: string[];           // Cartesia e.g., ["positivity:high", "curiosity"]

    // Google & Azure
    pitch?: number | string;      // Google: number (-20.0 to 20.0), Azure: string (e.g., "+5Hz", "-2st")
    volumeGainDb?: number;        // Google: -96.0 to 16.0

    // Azure
    rate?: string;                // e.g., "+10%", "-5%"
}

export interface VoiceWidgetStyles {
    // Position & Style
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    widgetStyle: 'floating-button' | 'embedded' | 'full-screen-overlay';

    // Colors
    primaryColor: string;
    backgroundColor: string;
    activeCallColor: string;
    mutedColor: string;

    // Icons (URLs or icon identifiers)
    callButtonIcon: string;
    endCallIcon: string;
    muteIcon: string;

    // Dimensions
    buttonSize: string;           // e.g., '64px'
    expandedWidth: string;        // e.g., '320px'
    expandedHeight: string;       // e.g., '400px'

    // Button Configuration
    showButtonText: boolean;
    buttonText: string;           // e.g., "Talk to us"

    // Visual Feedback
    showWaveform: boolean;
    showCallTimer: boolean;
    showTranscription: boolean;

    // Branding
    showPoweredBy: boolean;
    avatarUrl?: string;
    displayName: string;
}

export interface ConversationTranscript {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: string;
}

export interface CallMetrics {
    // Define metrics properties here
    [key: string]: any;
}

export interface UpdateVoiceConfigInput {
    status?: 'ACTIVE' | 'INACTIVE' | 'TESTING';
    turnDetection?: 'stt' | 'vad' | 'realtime_llm' | 'manual';
    sttModel?: string;
    ttsModel?: string;
    llmModel?: string;
    voiceId?: string;
    voiceSettings?: Record<string, any>;
    systemPrompt?: string | null;
    initialGreeting?: string;
    closingMessage?: string;
}
export interface VoiceWidgetConfig extends VoiceWidgetStyles {
    id: string;
    chatbotId: string;
    isEnabled: boolean;
    allowedDomains: string[];
    createdAt: string;
    updatedAt: string;
}

export interface VoiceCallSession {
    id: string;
    chatbotId: string;
    userId?: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    status: 'active' | 'completed' | 'failed';
    transcript?: ConversationTranscript[];
    metrics?: CallMetrics;
    recordingUrl?: string;
    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// LiveKit Voice Agent Types
// =============================================================================

/**
 * Voice agent configuration passed to the Python agent via LiveKit metadata
 */
export interface VoiceAgentConfig {
    instructions: string;
    tts_voice: string;
    stt_language: string;
    tts_language: string;
}

/**
 * Response from the voice token generation endpoint
 */
export interface LiveKitTokenResponse {
    serverUrl: string;
    participantToken: string;
    roomName: string;
    participantName: string;
}

/**
 * Connection details needed to connect to LiveKit room
 */
export interface VoiceConnectionDetails {
    serverUrl: string;
    participantToken: string;
}

/**
 * LiveKit room connection state
 */
export type LiveKitConnectionState =
    | 'disconnected'
    | 'connecting'
    | 'connected'
    | 'reconnecting'
    | 'failed';

/**
 * Voice call state for UI rendering
 */
export interface VoiceCallState {
    connectionState: LiveKitConnectionState;
    isMuted: boolean;
    isAgentSpeaking: boolean;
    callDuration: number;
    transcript: ConversationTranscript[];
}