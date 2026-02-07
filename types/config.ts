import { WidgetConfig } from "./widget";

export type UIConfigInput = WidgetConfig & {
  InitialMessage?: string;
};

export type VoiceState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export interface TranscriptMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface VoiceCallState {
  status: VoiceState;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'agent';
  content: string;
  createdAt: Date;
  // Compatibility fields
  timestamp?: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  agentId?: string;

  // Extended fields
  citations?: string[];
  responseId?: string;
  source?: 'voice';
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ResponseUser {
  uniqueClientId: string;
  converslyWebId: string;
  metadata?: Record<string, any>;
}

export interface ResponseUserMetadata {
  [key: string]: any;
}

export interface ResponseRequestMetadata {
  originUrl?: string;
  [key: string]: any;
}

export interface ChatbotResponseRequest {
  query: string;
  mode: string;
  user: ResponseUser;
  metadata?: ResponseRequestMetadata;
  conversationId?: string;
}

export interface ChatbotResponseData {
  success: boolean;
  response: string;
  citations?: string[];
  conversation_id?: string;
  conversation_status?: "ACTIVE" | "CLOSED";
  message_id?: string;
  responseId?: string;
  escalation?: {
    id: string;
    status: string;
    reason?: string;
  };
  partial?: {
    styles?: any;
    attention?: any;
    initialMessage?: string;
    callEnabled?: boolean;
    suggestedMessages?: string[];
    converslyWebId?: string;
    uniqueClientId?: string;
  };
}

export interface ChatHistoryMessage {
  message_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  citations?: string[];
}

export type ChatbotHistoryData = ChatbotResponseData & {
  messages: ChatHistoryMessage[];
};

export interface FeedbackRequest {
  responseId: string;
  feedback: "positive" | "negative";
  comment?: string;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
}

export interface PlaygroundConfig {
  chatbotId: string;
  chatbotSystemPrompt: string;
  chatbotModel: string;
  chatbotTemperature: number;
}

export interface PlaygroundResponseRequest extends ChatbotResponseRequest {
  chatbot: PlaygroundConfig;
  chatbotId: string;
}

export function convertBackendToUIMessage(msg: any): Message {
  const date = new Date(msg.created_at || Date.now());
  return {
    id: msg.id || Date.now().toString(),
    role: msg.role,
    content: msg.content,
    createdAt: date,
    timestamp: date,
  };
}

export function convertUIToBackendMessages(messages: Message[]): ChatMessage[] {
  return messages.map(m => ({
    role: (m.role === "agent" ? "assistant" : m.role) as "user" | "assistant" | "system",
    content: m.content
  }));
}

export function createUserMessage(content: string): Message {
  const date = new Date();
  return {
    id: Date.now().toString(),
    role: "user",
    content,
    createdAt: date,
    timestamp: date,
  };
}
