// import { WidgetConfig } from "./chatbot"; // Circular? No, will fix.

export type WidgetView = "home" | "messages" | "chat";

export interface WidgetStyles {
    // Message / content related
    displayName: string;
    messagePlaceholder: string;
    // API field names (different from UIConfigInput)
    continueShowingSuggestedMessages: boolean;
    collectUserFeedback: boolean;
    regenerateMessages: boolean;
    dismissableNoticeText: string;  // Note: API uses "dismissable" not "dismissible"
    footerText: string;

    // Behaviour / other
    autoShowInitial: boolean;
    autoShowDelaySec: number;

    // Style / colour / icons / layout
    primaryColor: string;
    widgetBubbleColour: string;
    PrimaryIcon: string;
    widgeticon: string;
    alignChatButton: 'left' | 'right';
    showButtonText: boolean;
    buttonText: string;
    appearance: 'light' | 'dark';
    widgetButtonText: string;
    chatWidth: string;
    chatHeight: string;
}

export interface WidgetAttentionConfig {
    messagePopupEnabled?: boolean;
    popupSoundEnabled?: boolean;
    /** Optional; absent by default when not set */
    soundUrl?: string;
}

export interface ChatbotCustomizationPartial {
    styles: WidgetStyles;
    callEnabled?: boolean;
    attention?: WidgetAttentionConfig;
    initialMessage: string;
    suggestedMessages: string[];
}

export interface ChatbotCustomizationPayload {
    chatbotId: string;
    partial: ChatbotCustomizationPartial;
}

export interface DeployResult {
    success: boolean;
    liveVersion: number;
    deployedAt: string | Date;
}

export interface RollbackResult {
    success: boolean;
    restoredToVersion: number;
}

export interface DeployStatus {
    deployStatusField: 'SYNCED' | 'DEPLOYING' | 'LOCKED' | 'DEV_DIRTY';
    devVersion: number;
    liveVersion: number;
    lastDeployedAt: string | Date | null;
}

export interface Agent {
    id: string;
    name: string;
    avatar?: string;
    status: 'online' | 'offline' | 'away';
    role?: string;
}

export interface NewsFeedItem {
    id: string;
    title: string;
    description: string;
    image?: string;
    link?: string;
    version?: string;
    date?: string;
}

export interface WidgetConfig {
    // Branding
    brandName: string;
    brandLogo?: string;
    primaryColor: string; // e.g., "#2D5A27" for Cal.com green
    bubbleColor?: string; // Widget bubble background color
    widgetIcon?: string; // Custom icon for the chat bubble

    // Bot Identity
    botName?: string;
    botAvatar?: string;
    showPoweredBy?: boolean;

    // Personalization
    userName?: string;
    userEmail?: string;
    userAvatar?: string;

    // UI Customization
    greeting: string;
    subGreeting?: string;
    placeholder: string;
    footerText?: string;
    appearance: 'light' | 'dark';
    position: 'bottom-right' | 'bottom-left';

    // Size & Layout
    chatWidth?: string; // e.g., "380px"
    chatHeight?: string; // e.g., "580px"

    // Button Options
    showButtonText?: boolean;
    buttonText?: string;

    // Behavior
    autoShowInitial?: boolean;
    autoShowDelaySec?: number;

    // Features
    enableNewsFeed?: boolean;
    enableVoice?: boolean;
    showAgentAvatars?: boolean;
    collectUserFeedback?: boolean;
    regenerateMessages?: boolean;
    continueSuggestedMessages?: boolean;
    dismissableNoticeText?: string;

    // Suggested Messages
    suggestedMessages?: string[];

    // Attention (popup/sound)
    messagePopupEnabled?: boolean;
    popupSoundEnabled?: boolean;
    popupSoundUrl?: string;

    // Content
    newsFeedItems?: NewsFeedItem[];
    agents?: Agent[];

    // API Credentials (for messaging)
    chatbotId?: string;
    testing?: boolean;
    isPlayground?: boolean;
    playgroundOverrides?: {
        systemPrompt?: string;
        model?: string;
        temperature?: number;
        chatbotId?: string;
    };
}

export type UIConfigInput = WidgetConfig & {
    InitialMessage?: string;
};
