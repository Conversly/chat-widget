import { API } from "@/lib/api/config";
import type { ApiResponse } from "@/lib/api/config";
import type { LiveKitTokenResponse } from "@/types/voice";

/**
 * Generate a LiveKit room token with agent configuration
 * This token is used to connect to a LiveKit room and dispatch a voice agent
 * 
 * z-terminal API: POST /voice/:chatbotId/token
 * Request body: { agent_config: VoiceAgentConfig }
 * Response: { success: true, data: LiveKitTokenResponse }
 */
export const generateVoiceToken = async (
    chatbotId: string,
): Promise<LiveKitTokenResponse> => {
    const endpoint = API.BASE_URL + API.ENDPOINTS.TERMINAL.VOICE.GENERATE_TOKEN(chatbotId);

    console.log('[Voice API] Generating token with:', { 
        chatbotId, 
    });

    const response = await fetch(endpoint, {
        method: "POST",
    });

    if (!response.ok) {
        throw new Error(`Voice token request failed: ${response.status} ${response.statusText}`);
    }

    const res = await response.json() as ApiResponse<LiveKitTokenResponse, Error>;

    if (!res.success) {
        throw new Error(res.message);
    }

    console.log('[Voice API] Token generated successfully:', res.data);
    return res.data;
};
