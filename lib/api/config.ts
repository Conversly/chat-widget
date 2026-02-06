export const API = {
  BASE_URL: "https://terminal.apps.verlyai.xyz/api/v1",
  WS_BASE_URL: "wss://ws.apps.verlyai.xyz",
  RESPONSE_BASE_URL: "https://response.apps.verlyai.xyz",
  // RESPONSE_BASE_URL: "http://localhost:8030",
  ENDPOINTS: {
    RESPONSE: {
      BASE_URL: () => "/response",
      STREAM: () => "/response/stream",
      FEEDBACK: () => "/feedback",
      // response service playground endpoint
      PLAYGROUND: () => "/playground/response",
      PLAYGROUND_STREAM: () => "/playground/response/stream",
    },
    DEPLOY: {
      BASE_URL: () => "/deploy",
      WIDGET: () => "/external/:chatbotId",  // get
    },
    VOICE: {
      BASE_URL: () => "/voice",
      GENERATE_TOKEN: () => "/:chatbotId/token", // POST to get LiveKit token
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
