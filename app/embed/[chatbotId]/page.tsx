"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { EmbeddedWidget } from "@/components/widget/EmbeddedWidget";
import "@/app/globals.css";

/**
 * Embed page - renders the chat widget for iframe embedding
 * 
 * URL: /embed/[chatbotId]?position=bottom-right&testing=false
 */
function EmbedContent() {
    const params = useParams();
    const searchParams = useSearchParams();

    const chatbotId = params.chatbotId as string;
    const testing = searchParams.get("testing") === "true";

    // Force transparent background for the embed page
    if (typeof document !== 'undefined') {
        document.body.style.background = 'transparent';
        document.documentElement.style.background = 'transparent';
    }

    if (!chatbotId) {
        return (
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                fontFamily: "system-ui, sans-serif",
                color: "#666"
            }}>
                Missing chatbot ID
            </div>
        );
    }

    return <EmbeddedWidget chatbotId={chatbotId} testing={testing} />;
}

export default function EmbedPage() {
    return (
        <Suspense fallback={null}>
            <EmbedContent />
        </Suspense>
    );
}
