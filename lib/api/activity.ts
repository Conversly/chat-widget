import axios, { type AxiosResponse } from "axios";
import { API } from "@/lib/api/config";
import type { ApiResponse } from "@/lib/api/config";
import {
  type ChatHistoryMessage,
  type TerminalWidgetHistoryResponse,
  type TerminalVisitorConversationItem,
  type TerminalVisitorConversationsPayload,
} from "@/types/activity";
import { ResponseServiceApiError } from "@/lib/api/errors";
import type { ResponseServiceErrorPayload, ChatbotHistoryData } from "@/types/response";

// Re-export for consumers that import from this file
export type { TerminalVisitorConversationItem, TerminalVisitorConversationsPayload };

export const terminalFetch = axios.create({
  baseURL: API.BASE_URL,
  withCredentials: true,
});

/**
 * Fetch conversation list for a visitor (terminal service).
 * GET /activity/conversations/by-visitor?visitorId=...
 */
export async function listVisitorConversations(
  visitorId: string,
): Promise<TerminalVisitorConversationItem[]> {
  const vid = (visitorId || "").trim();
  if (!vid) return [];

  const res = await terminalFetch.get<
    ApiResponse<TerminalVisitorConversationsPayload, Error>
  >(API.ENDPOINTS.TERMINAL.ACTIVITY.CONVERSATIONS_BY_VISITOR(), {
    params: { visitorId: vid },
  });

  if (!res.data.success) {
    throw new Error((res.data as any).message || "Failed to list conversations");
  }

  const data = res.data.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray((data as any).data))
    return (data as any).data;
  return [];
}

function isTerminalWidgetHistoryResponse(
  v: unknown,
): v is TerminalWidgetHistoryResponse {
  if (!v || typeof v !== "object") return false;
  if (!("success" in v) || typeof (v as any).success !== "boolean")
    return false;
  if (!("data" in v) || !(v as any).data || typeof (v as any).data !== "object")
    return false;
  const d = (v as any).data;
  return typeof d.conversationId === "string" && Array.isArray(d.messages);
}

function normalizeTerminalHistoryToWidgetHistory(
  terminalRes: TerminalWidgetHistoryResponse,
): ChatbotHistoryData {
  const d = terminalRes.data;
  const conversationStatus =
    typeof d.conversationStatus === "string" ? d.conversationStatus : "";
  const isClosed = conversationStatus.toUpperCase() === "CLOSED";

  const messages: ChatHistoryMessage[] = (d.messages || []).map((m) => {
    const createdAt =
      m.createdAt instanceof Date
        ? m.createdAt.toISOString()
        : typeof m.createdAt === "string" && m.createdAt.trim()
          ? m.createdAt
          : new Date().toISOString();

    const roleRaw = typeof m.role === "string" ? m.role.toLowerCase() : "";
    const role: "user" | "assistant" = roleRaw === "user" ? "user" : "assistant";

    return {
      message_id: m.messageId,
      role,
      content: m.content,
      citations: Array.isArray(m.citations) ? m.citations : [],
      created_at: createdAt,
    };
  });

  return {
    success: terminalRes.success,
    response: "",
    citations: [],
    conversation_id: d.conversationId,
    conversation_status: isClosed ? "CLOSED" : "ACTIVE",
    escalation: d.escalation
      ? {
        id: d.escalation.id,
        status: d.escalation.status,
        ...(d.escalation.reason ? { reason: d.escalation.reason } : {}),
      }
      : undefined,
    messages,
  };
}

/**
 * Fetch full chat transcript for an existing widget conversation (terminal service).
 * Returns the same envelope shape as the legacy response-service history for widget compatibility.
 */
export async function getChatHistory(
  chatbotId: string,
  conversationId: string,
  testing: boolean = false,
): Promise<ChatbotHistoryData> {
  const cid = (conversationId || "").trim();
  const botId = (chatbotId || "").trim();

  if (testing) {
    return {
      success: true,
      response: "",
      citations: [],
      conversation_id: cid,
      messages: [],
    };
  }

  if (!botId) {
    throw new ResponseServiceApiError({
      error: "missing_chatbot_id",
      message: "chatbotId is required to fetch chat history",
    });
  }

  if (!cid) {
    throw new ResponseServiceApiError({
      error: "missing_conversation_id",
      message: "conversationId is required to fetch chat history",
    });
  }

  let res: ChatbotHistoryData;
  try {
    const raw = await terminalFetch
      // Terminal expects `conversationId` + `chatbotId` in query params and no JSON body.
      .post(API.ENDPOINTS.TERMINAL.ACTIVITY.HISTORY(), undefined, {
        params: { conversationId: cid, chatbotId: botId },
      })
      .then((res: AxiosResponse<unknown>) => res.data);

    if (isTerminalWidgetHistoryResponse(raw)) {
      res = normalizeTerminalHistoryToWidgetHistory(raw);
    } else {
      res = raw as ChatbotHistoryData;
    }
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
    throw new ResponseServiceApiError({
      error: "unsuccessful_response",
      message: "Failed to get chat history",
    });
  }

  return res;
}
