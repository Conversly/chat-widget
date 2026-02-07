export const API = {
  /**
   * Terminal service base URL (z-terminal).
   * Override via `NEXT_PUBLIC_TERMINAL_BASE_URL`.
   */
  BASE_URL:
    (typeof process !== "undefined" &&
      (process.env as any)?.NEXT_PUBLIC_TERMINAL_BASE_URL) ||
    "https://terminal.apps.verlyai.xyz/api/v1",

  /**
   * WebSocket base URL (socket server).
   * Override via `NEXT_PUBLIC_WS_BASE_URL`.
   */
  WS_BASE_URL:
    (typeof process !== "undefined" && (process.env as any)?.NEXT_PUBLIC_WS_BASE_URL) ||
    "wss://ws.apps.verlyai.xyz",

  /**
   * Response service base URL (response-service).
   * Override via `NEXT_PUBLIC_RESPONSE_BASE_URL`.
   */
  RESPONSE_BASE_URL:
    (typeof process !== "undefined" &&
      (process.env as any)?.NEXT_PUBLIC_RESPONSE_BASE_URL) ||
    "https://response.apps.verlyai.xyz",
  ENDPOINTS: {
    /**
     * Terminal service routes (base: `API.BASE_URL`)
     * - z-terminal: `/activity/*`, `/deploy/*`, `/voice/*`
     */
    TERMINAL: {
      ACTIVITY: {
        HISTORY: () => "/activity/history",
        CONVERSATIONS_BY_VISITOR: () => "/activity/conversations/by-visitor",
      },
      DEPLOY: {
        WIDGET_EXTERNAL: () => "/deploy/widget/external",
      },
      VOICE: {
        GENERATE_TOKEN: (chatbotId: string) =>
          `/voice/${encodeURIComponent(chatbotId)}/token`,
      },
      LEADS: {
        BASE_URL: () => "/leads",
      },
    },

    /**
     * Response service routes (base: `API.RESPONSE_BASE_URL`)
     * - response-service: `/response/*`, `/playground/response/*`
     */
    RESPONSE: {
      BASE_URL: () => "/response",
      STREAM: () => "/response/stream",
      FEEDBACK: () => "/feedback",
      // response service playground endpoint
      PLAYGROUND: () => "/playground/response",
      PLAYGROUND_STREAM: () => "/playground/response/stream",
    },

    // Legacy aliases (prefer `ENDPOINTS.TERMINAL.*` in new code)
    DEPLOY: {
      WIDGET_EXTERNAL: () => "/deploy/widget/external", // GET (params: chatbotId)
    },
    VOICE: {
      GENERATE_TOKEN: (chatbotId: string) =>
        `/voice/${encodeURIComponent(chatbotId)}/token`, // POST
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// WebSocket Configuration (mirrors `client_v2/lib/api/config.ts`)
// ─────────────────────────────────────────────────────────────────────────────
//
// Backend expects: ws(s)://<SOCKET_SERVER_HOST>/terminal?client_type=<widget|agent>
//
export type WsClientType = "widget" | "agent"

export function buildWsUrl(clientType: WsClientType): string {
  const base = (API.WS_BASE_URL || "").replace(/\/$/, "")
  if (!base) return ""

  const hasTerminal = /\/terminal$/.test(base)
  const terminalUrl = hasTerminal ? base : `${base}/terminal`
  return `${terminalUrl}?client_type=${encodeURIComponent(clientType)}`
}

// Default to widget clientType for this package.
export const WS_URL = buildWsUrl("widget")

export type ApiResponse<T, U = never> =
  | { success: false; message: string; data: U }
  | { success: true; message: string; data: T };
