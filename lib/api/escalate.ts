import axios, { type AxiosResponse } from "axios";
import { API, type ApiResponse } from "@/lib/api/config";

export interface SubmitOfflineContactRequest {
  chatbotId: string;
  conversationId: string;
  escalationId: string;
  name: string;
  email: string;
  submittedAt: string;
}

export interface SubmitOfflineContactResponse {
  success: boolean;
}

/**
 * Submit contact info when no agents are online during an escalation.
 * POST ${API.ENDPOINTS.TERMINAL.ESCALATE.HANDLE_ABSENCE()}
 */
export async function submitOfflineContact(
  request: SubmitOfflineContactRequest,
): Promise<SubmitOfflineContactResponse> {
  const res = await axios.post<ApiResponse<SubmitOfflineContactResponse>>(
    `${API.ENDPOINTS.TERMINAL.ESCALATE.HANDLE_ABSENCE()}`,
    request,
    {
      headers: {
        "Content-Type": "application/json",
        "x-verly-chatbot-id": request.chatbotId,
      },
    },
  );

  if (!res.data.success) {
    throw new Error((res.data as any).message || "Failed to submit offline contact");
  }

  return res.data.data;
}
