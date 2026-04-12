import { ChatHistoryMessage, ConversationState } from "@/types/activity";

export interface ChatbotResponseRequest {
  query?: string; // JSON stringified messages
  mode?: string;
  conversationId?: string;
  chatbotId: string;
  metadata?: {
    pageUrl?: string;
    pageTitle?: string;
    pageContext?: import("./page-context").PageContext;
  };
}

export interface ChatbotResponseData {
  success: boolean;
  response: string;
  citations?: string[];
  conversation_id?: string;
  conversation_status?: "ACTIVE" | "CLOSED";
  conversationState?: ConversationState;
  message_id?: string;
  request_id?: string;
  responseId?: string;
  escalation?: {
    id: string;
    reason?: string;
    requested_at?: string;
  };
  partial?: {
    styles?: any;
    attention?: any;
    initialMessage?: string;
    callEnabled?: boolean;
    suggestedMessages?: string[];
  };
  lead_generation?: boolean;
}

export interface FeedbackRequest {
  responseId: string;
  feedback: "positive" | "negative";
  comment?: string;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
  data?: any;
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

export type ResponseServiceErrorPayload = {
  error?: string;
  message?: string;
  timestamp?: string;
};

export type ChatbotHistoryData = ChatbotResponseData & {
  messages: ChatHistoryMessage[];
};

export type ResponseStreamEvent =
  | {
    type: "meta";
    conversation_id?: string;
    contact_id?: string;
    message_id?: string;
    request_id?: string;
  }
  | {
    type: "delta";
    delta?: string;
  }
  | {
    type: "control";
    escalate?: boolean;
    reason?: string;
  }
  | {
    type: "citations";
    citations?: string[];
  }
  | {
    /**
     * Query clarification / refinement suggestions.
     * The backend emitted a short-circuit early-return instead of a full
     * RAG answer. The UI should render these as clickable chips.
     */
    type: "suggestions";
    suggestions: string[];
  }
  | {
    type: "final";
    response?: ChatbotResponseData;
  }
  | {
    type: "error";
    error?: string;
    message?: string;
  };

export type ResponseStreamCallbacks = {
  onMeta?: (event: Extract<ResponseStreamEvent, { type: "meta" }>) => void;
  onDelta?: (delta: string, accumulated: string) => void;
  onControl?: (escalate: boolean, reason?: string) => void;
  onCitations?: (citations: string[]) => void;
  /**
   * Called when the backend emits a `suggestions` event instead of a full answer.
   * The UI should render these as clickable chips; clicking one re-sends it as
   * a user message so the next request goes straight to RAG + generation.
   */
  onSuggestions?: (suggestions: string[]) => void;
  onFinal?: (response: ChatbotResponseData) => void;
  onError?: (error: string, message?: string) => void;
  /**
   * Called for malformed NDJSON lines (best-effort; the stream continues).
   * This is intentionally separate from server `type: "error"` events.
   */
  onParseError?: (line: string, err: unknown) => void;
};
