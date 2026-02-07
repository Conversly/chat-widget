import { API } from "@/lib/api/config";
import type { ApiResponse } from "@/lib/api/config";
import {
  type ChatbotResponseRequest,
  type ChatbotResponseData,
  type FeedbackRequest,
  type FeedbackResponse,
  type PlaygroundResponseRequest,
  type ResponseServiceErrorPayload,
  type ResponseStreamEvent,
  type ResponseStreamCallbacks,
  type ChatbotHistoryData,
} from "@/types/response";
import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { getStoredVisitorId, setStoredVisitorId, VISITOR_ID_HEADER } from "@/lib/storage";
import { ResponseServiceApiError } from "@/lib/api/errors";
import { type ChatHistoryMessage, type ChatMessage } from "@/types/activity";

// Re-export for consumers that still import from this file
export type {
  ResponseServiceErrorPayload,
  ResponseStreamEvent,
  ResponseStreamCallbacks,
  ChatHistoryMessage,
  ChatbotHistoryData,
};
export { ResponseServiceApiError };

// Create a separate axios instance for response API
export const responseFetch = axios.create({
  baseURL: API.RESPONSE_BASE_URL,
  withCredentials: true,
});

responseFetch.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const vid = getStoredVisitorId();
    if (vid) {
      config.headers = config.headers || {};
      // Don't override if caller set it explicitly.
      if (!(VISITOR_ID_HEADER.toLowerCase() in (config.headers as any))) {
        (config.headers as any)[VISITOR_ID_HEADER] = vid;
      }
    }
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  },
);

responseFetch.interceptors.response.use((res) => {
  const headerVal = (res.headers as any)?.["x-visitor-id"];
  if (typeof headerVal === "string" && headerVal.trim()) {
    setStoredVisitorId(headerVal);
  }
  return res;
});

function asApiErrorFromResponseText(
  status: number,
  statusText: string,
  bodyText: string,
): ResponseServiceApiError {
  try {
    const parsed = JSON.parse(bodyText) as unknown;
    if (parsed && typeof parsed === "object" && "error" in parsed) {
      return new ResponseServiceApiError(parsed as ResponseServiceErrorPayload, { status });
    }
  } catch {
    // ignore
  }
  return new ResponseServiceApiError(
    { error: "http_error", message: `HTTP ${status}: ${statusText}` },
    { status },
  );
}

/**
 * Stream a chatbot response using NDJSON from `/response/stream`.
 * Resolves with the final `ChatbotResponseData` (same shape as non-streaming `/response`).
 */
export async function streamChatbotResponse(
  requestBody: ChatbotResponseRequest,
  callbacks: ResponseStreamCallbacks,
  signal?: AbortSignal,
): Promise<ChatbotResponseData> {
  const base = (API.RESPONSE_BASE_URL || "").replace(/\/$/, "");
  const url = new URL(API.ENDPOINTS.RESPONSE.STREAM(), `${base}/`).toString();

  const existingVisitorId = getStoredVisitorId();
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/x-ndjson, application/json",
      ...(existingVisitorId ? { [VISITOR_ID_HEADER]: existingVisitorId } : {}),
    },
    body: JSON.stringify(requestBody),
    signal,
  });

  // Persist visitor id ASAP so conversationId can be stored under the right key.
  const headerVisitorId = res.headers.get(VISITOR_ID_HEADER);
  if (headerVisitorId && headerVisitorId.trim()) {
    setStoredVisitorId(headerVisitorId);
  }

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw asApiErrorFromResponseText(res.status, res.statusText, bodyText);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new ResponseServiceApiError({
      error: "no_response_body",
      message: "No response body for streaming request",
    });
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";
  let finalResponse: ChatbotResponseData | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const event = JSON.parse(trimmed) as ResponseStreamEvent | (ChatbotResponseData & { type?: string });

          // Support both: { type: "final", response: {...} } and a raw final envelope.
          if (
            (event as any)?.type !== "meta" &&
            (event as any)?.type !== "delta" &&
            (event as any)?.type !== "control" &&
            (event as any)?.type !== "citations" &&
            (event as any)?.type !== "final" &&
            (event as any)?.type !== "error"
          ) {
            if ((event as any)?.success !== undefined && typeof (event as any)?.response === "string") {
              finalResponse = event as ChatbotResponseData;
              callbacks.onFinal?.(finalResponse);
              continue;
            }
            callbacks.onParseError?.(trimmed, new Error("Unknown NDJSON event shape"));
            continue;
          }

          switch ((event as ResponseStreamEvent).type) {
            case "meta": {
              const meta = event as Extract<ResponseStreamEvent, { type: "meta" }>;
              const vid = (meta as any)?.visitor_id;
              if (typeof vid === "string" && vid.trim()) {
                setStoredVisitorId(vid);
              }
              callbacks.onMeta?.(meta);
              break;
            }
            case "delta": {
              const delta = (event as Extract<ResponseStreamEvent, { type: "delta" }>).delta;
              if (typeof delta === "string" && delta.length > 0) {
                accumulated += delta;
                callbacks.onDelta?.(delta, accumulated);
              }
              break;
            }
            case "control": {
              const e = event as Extract<ResponseStreamEvent, { type: "control" }>;
              callbacks.onControl?.(!!e.escalate, e.reason);
              break;
            }
            case "citations": {
              const e = event as Extract<ResponseStreamEvent, { type: "citations" }>;
              callbacks.onCitations?.(Array.isArray(e.citations) ? e.citations : []);
              break;
            }
            case "final": {
              const e = event as Extract<ResponseStreamEvent, { type: "final" }>;
              if (e.response && typeof e.response === "object") {
                finalResponse = e.response;
                callbacks.onFinal?.(finalResponse);
              }
              break;
            }
            case "error": {
              const e = event as Extract<ResponseStreamEvent, { type: "error" }>;
              callbacks.onError?.(e.error || "unknown", e.message);
              break;
            }
          }
        } catch (err) {
          callbacks.onParseError?.(trimmed, err);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!finalResponse) {
    throw new ResponseServiceApiError({
      error: "stream_ended_without_final",
      message: "Stream ended before a final response event was received",
    });
  }

  if (!finalResponse.success) {
    throw new ResponseServiceApiError({
      error: "unsuccessful_response",
      message: "Failed to get chatbot response (streaming)",
    });
  }

  return finalResponse;
}

/**
 * Stream a playground response using NDJSON from `/playground/response/stream`.
 * Resolves with the final `ChatbotResponseData` (same shape as non-streaming `/playground/response`).
 */
export async function streamPlaygroundResponse(
  requestBody: PlaygroundResponseRequest,
  callbacks: ResponseStreamCallbacks,
  signal?: AbortSignal,
): Promise<ChatbotResponseData> {
  const base = (API.RESPONSE_BASE_URL || "").replace(/\/$/, "");
  const url = new URL(API.ENDPOINTS.RESPONSE.PLAYGROUND_STREAM(), `${base}/`).toString();

  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/x-ndjson, application/json",
    },
    body: JSON.stringify(requestBody),
    signal,
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw asApiErrorFromResponseText(res.status, res.statusText, bodyText);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new ResponseServiceApiError({
      error: "no_response_body",
      message: "No response body for streaming request",
    });
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";
  let finalResponse: ChatbotResponseData | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const event = JSON.parse(trimmed) as ResponseStreamEvent | (ChatbotResponseData & { type?: string });

          // Support both: { type: "final", response: {...} } and a raw final envelope.
          if (
            (event as any)?.type !== "meta" &&
            (event as any)?.type !== "delta" &&
            (event as any)?.type !== "control" &&
            (event as any)?.type !== "citations" &&
            (event as any)?.type !== "final" &&
            (event as any)?.type !== "error"
          ) {
            if ((event as any)?.success !== undefined && typeof (event as any)?.response === "string") {
              finalResponse = event as ChatbotResponseData;
              callbacks.onFinal?.(finalResponse);
              continue;
            }
            callbacks.onParseError?.(trimmed, new Error("Unknown NDJSON event shape"));
            continue;
          }

          switch ((event as ResponseStreamEvent).type) {
            case "meta": {
              callbacks.onMeta?.(event as Extract<ResponseStreamEvent, { type: "meta" }>);
              break;
            }
            case "delta": {
              const delta = (event as Extract<ResponseStreamEvent, { type: "delta" }>).delta;
              if (typeof delta === "string" && delta.length > 0) {
                accumulated += delta;
                callbacks.onDelta?.(delta, accumulated);
              }
              break;
            }
            case "control": {
              const e = event as Extract<ResponseStreamEvent, { type: "control" }>;
              callbacks.onControl?.(!!e.escalate, e.reason);
              break;
            }
            case "citations": {
              const e = event as Extract<ResponseStreamEvent, { type: "citations" }>;
              callbacks.onCitations?.(Array.isArray(e.citations) ? e.citations : []);
              break;
            }
            case "final": {
              const e = event as Extract<ResponseStreamEvent, { type: "final" }>;
              if (e.response && typeof e.response === "object") {
                finalResponse = e.response;
                callbacks.onFinal?.(finalResponse);
              }
              break;
            }
            case "error": {
              const e = event as Extract<ResponseStreamEvent, { type: "error" }>;
              callbacks.onError?.(e.error || "unknown", e.message);
              break;
            }
          }
        } catch (err) {
          callbacks.onParseError?.(trimmed, err);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!finalResponse) {
    throw new ResponseServiceApiError({
      error: "stream_ended_without_final",
      message: "Stream ended before a final response event was received",
    });
  }

  if (!finalResponse.success) {
    throw new ResponseServiceApiError({
      error: "unsuccessful_response",
      message: "Failed to get playground response (streaming)",
    });
  }

  return finalResponse;
}

/**
 * Send a chat query to the chatbot and get a response
 * @param messages - Array of chat messages (conversation history)
 * @param user - User information including uniqueClientId and converslyWebId (API_KEY)
 * @param mode - Response mode (default: "default")
 * @param metadata - Optional metadata like originUrl
 * @param testing - If true, returns dummy response instead of calling API
 * @returns ChatbotResponseData with response text and citations
 */
export const getChatbotResponse = async (
  messages: ChatMessage[],
  user: ChatbotResponseRequest["user"],
  mode: string = "default",
  metadata?: ChatbotResponseRequest["metadata"],
  conversationId?: ChatbotResponseRequest["conversationId"],
  testing: boolean = false,
): Promise<ChatbotResponseData> => {
  // Return dummy response if testing mode is enabled
  if (testing) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const dummyResponses = [
          {
            responseId: `resp-${Date.now()}-1`,
            response: "This is a long single-line dummy response intended to simulate a real world assistant output inside your chat widget without introducing newline characters or line breaks so that you can test how your markdown renderer handles dense continuous text flow with inline formatting like **bold words**, *italic emphasis*, `inlineCodeExample()` and even small lists written in sentence form such as item one, item two, item three all separated by commas rather than actual newlines, it should also include references in a conversational style for example you might mention React documentation at react.dev or TypeScript docs at typescriptlang.org while still keeping everything inside one physical line, additionally this text intentionally contains headings written inline like ### Compact Heading Style and blockquote style markers like > this is a quote but still not starting a new line so you can observe how your renderer behaves when structural markdown appears in the middle of a long flowing sentence, we can even add a table representation inline such as | name | type | required | id | uuid | yes | text | string | yes | to see whether the GFM plugin attempts to parse it or ignores it because of the missing newlines, furthermore this response is long enough to expose layout bugs like background color bleeding from the parent white container into the chat bubble, blur caused by subpixel rendering, or excessive padding caused by margin collapse rules, the goal is that when this string is rendered inside your bubble the background remains solid colored and the text stays sharp without any ghosting or seeping effect, you can scroll this single line horizontally or let it wrap naturally but there must be no explicit newline characters present in the payload, if everything works correctly your compact chat UI should look dense, crisp, readable and free from visual noise which is exactly what you want before shipping the widget into production for Conversly or any other SaaS interface you are building",
            citations: [
              "https://react.dev/",
              "https://www.typescriptlang.org/docs/"
            ],
            success: true,
          }
        ];


        const response = dummyResponses[Math.floor(Math.random() * dummyResponses.length)];
        resolve(response);
      }, 1500); // Simulate network delay
    });
  }

  // Real API call
  const requestBody: ChatbotResponseRequest = {
    query: JSON.stringify(messages),
    mode,
    user,
    metadata,
    conversationId,
  };

  let res: ChatbotResponseData;
  try {
    res = await responseFetch(API.ENDPOINTS.RESPONSE.BASE_URL(), {
      method: "POST",
      data: requestBody,
    }).then((res: AxiosResponse<ChatbotResponseData>) => res.data);
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const data = err.response?.data as unknown;
      if (data && typeof data === "object" && "error" in data) {
        const payload = data as ResponseServiceErrorPayload;
        throw new ResponseServiceApiError(payload, { status });
      }
    }
    throw err;
  }

  if (!res.success) {
    throw new ResponseServiceApiError({ error: "unsuccessful_response", message: "Failed to get chatbot response" });
  }

  return res;
};

/**
 * Get a playground response from the chatbot with custom configuration
 * @param messages - Array of chat messages (conversation history)
 * @param user - User information including uniqueClientId and converslyWebId (API_KEY)
 * @param mode - Response mode (default: "default")
 * @param chatbotId - ID of the chatbot
 * @param systemPrompt - System prompt for the assistant
 * @param temperature - Temperature setting for the model
 * @param model - Model to use for the playground
 * @param metadata - Optional metadata like originUrl
 * @returns ChatbotResponseData with response text and citations
 */
export const getPlaygroundResponse = async (
  messages: ChatMessage[],
  user: PlaygroundResponseRequest["user"],
  mode: string = "default",
  chatbotId: string,
  systemPrompt: string,
  temperature: number,
  model: string,
  metadata?: PlaygroundResponseRequest["metadata"],
  conversationId?: PlaygroundResponseRequest["conversationId"],
): Promise<ChatbotResponseData> => {
  const requestBody: PlaygroundResponseRequest = {
    query: JSON.stringify(messages),
    mode,
    chatbot: {
      chatbotId: chatbotId,
      chatbotSystemPrompt: systemPrompt,
      chatbotModel: model,
      chatbotTemperature: temperature,
    },
    chatbotId: chatbotId,
    user,
    metadata,
    conversationId,
  };

  let res: ChatbotResponseData;
  try {
    res = await responseFetch(
      API.ENDPOINTS.RESPONSE.PLAYGROUND(),
      {
        method: "POST",
        data: requestBody,
      },
    ).then((res: AxiosResponse<ChatbotResponseData>) => res.data);
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const data = err.response?.data as unknown;
      if (data && typeof data === "object" && "error" in data) {
        const payload = data as ResponseServiceErrorPayload;
        throw new ResponseServiceApiError(payload, { status });
      }
    }
    throw err;
  }

  if (!res.success) {
    throw new ResponseServiceApiError({ error: "unsuccessful_response", message: "Failed to get playground response" });
  }

  return res;
};

/**
 * Submit feedback for a chatbot response
 * @param responseId - The responseId from the original chatbot response
 * @param feedback - Either "positive" or "negative"
 * @param comment - Optional comment about the feedback
 * @param testing - If true, returns dummy success response instead of calling API
 * @returns FeedbackResponse with success status
 */
export const submitFeedback = async (
  responseId: string,
  feedback: "positive" | "negative",
  comment?: string,
  testing: boolean = false,
): Promise<FeedbackResponse> => {
  // Return dummy response if testing mode is enabled
  if (testing) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: "Feedback submitted successfully (testing mode)",
        });
      }, 500);
    });
  }

  // Real API call
  const requestBody: FeedbackRequest = {
    responseId: responseId,
    feedback,
    comment,
  };

  const res = await responseFetch(
    API.ENDPOINTS.RESPONSE.BASE_URL() + API.ENDPOINTS.RESPONSE.FEEDBACK(),
    {
      method: "POST",
      data: requestBody,
    },
  ).then((res: AxiosResponse<ApiResponse<FeedbackResponse>>) => res.data);

  if (!res.success) {
    throw new Error(res.message || "Failed to submit feedback");
  }

  return res.data;
};
