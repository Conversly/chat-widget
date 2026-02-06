// Re-export types from package for backwards compatibility
export type {
  UIConfigInput,
  VoiceState,
  TranscriptMessage,
  VoiceCallState,
  Message,
  ChatMessage,
  ResponseUser,
  ResponseUserMetadata,
  ResponseRequestMetadata,
  ChatbotResponseRequest,
  ChatbotResponseData,
  FeedbackRequest,
  FeedbackResponse,
  PlaygroundConfig,
  PlaygroundResponseRequest,
} from "@/package/types"

export {
  convertBackendToUIMessage,
  convertUIToBackendMessages,
  createUserMessage,
} from "@/package/types"
