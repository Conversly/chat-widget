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

// REMOVED: Interceptors that relied on global storage.
// Identity headers (X-Visitor-Id, X-Chatbot-Id) are now injected per-request.

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

  const chatbotId = requestBody.chatbotId; // Must be present now
  const existingVisitorId = getStoredVisitorId(chatbotId);
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/x-ndjson, application/json",
      "x-verly-chatbot-id": chatbotId,
      ...(existingVisitorId ? { [VISITOR_ID_HEADER]: existingVisitorId } : {}),
    },
    body: JSON.stringify(requestBody),
    signal,
  });

  // Persist visitor id ASAP so conversationId can be stored under the right key.
  // Persist visitor id ASAP so conversationId can be stored under the right key.
  const headerVisitorId = res.headers.get(VISITOR_ID_HEADER);
  if (headerVisitorId && headerVisitorId.trim()) {
    setStoredVisitorId(chatbotId, headerVisitorId);
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
                setStoredVisitorId(chatbotId, vid);
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
              console.log("NDJSON citation event:", e);
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

  const chatbotId = requestBody.chatbotId;
  const existingVisitorId = getStoredVisitorId(chatbotId);

  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/x-ndjson, application/json",
      "x-verly-chatbot-id": chatbotId,
      ...(existingVisitorId ? { [VISITOR_ID_HEADER]: existingVisitorId } : {}),
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
    API.ENDPOINTS.RESPONSE.FEEDBACK(),
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
