export class ResponseServiceApiError extends Error {
    error?: string;
    timestamp?: string;
    status?: number;

    constructor(payload: { error?: string, message?: string, timestamp?: string }, opts?: { status?: number }) {
        super(payload.message || payload.error || "Response service error");
        this.name = "ResponseServiceApiError";
        this.error = payload.error;
        this.timestamp = payload.timestamp;
        this.status = opts?.status;
    }
}
