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
    converslyWebId: string;   // chatbot api key
    uniqueClientId: string;   // unique identifier for this conversation instance
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
