// Widget configuration types - matching widget-ui patterns with --cw-* CSS variables

export interface WidgetConfig {
  // Branding
  brandName: string;
  brandLogo?: string;
  primaryColor: string; // e.g., "#2D5A27" for Cal.com green
  bubbleColor?: string; // Widget bubble background color
  widgetIcon?: string; // Custom icon for the chat bubble

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
  converslyWebId?: string;
  uniqueClientId?: string;
  testing?: boolean;
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

export interface Conversation {
  id: string;
  agent: Agent;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agentId?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
}

export type WidgetView = 'home' | 'messages' | 'chat';
