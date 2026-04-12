"use client";

import { useState, useRef, useCallback, Suspense } from "react";
import { ChatWidget, type DemoScript, type DemoScriptAction } from "@/components/widget/ChatWidget";
import { getWidgetConfig } from "@/lib/api/chatbot";
import type { WidgetConfig } from "@/types/chatbot";
import { RefreshCw, Play, ChevronDown, ChevronUp } from "lucide-react";

// ---------------------------------------------------------------------------
// Config loader — mirrors EmbeddedWidget's transform logic
// ---------------------------------------------------------------------------
async function loadConfig(chatbotId: string): Promise<WidgetConfig> {
    const response = await getWidgetConfig(chatbotId);
    const styles = response.partial.styles || {};
    const attention = response.partial.attention || {};

    return {
        brandName: styles.displayName ?? "Chat",
        brandLogo: styles.PrimaryIcon ?? undefined,
        primaryColor: styles.primaryColor ?? "#2D5A27",
        bubbleColor: styles.widgetBubbleColour ?? styles.primaryColor ?? "#2D5A27",
        widgetIcon: styles.widgeticon ?? undefined,
        greeting: response.partial.initialMessage ?? "How can we help?",
        placeholder: styles.messagePlaceholder ?? "Message...",
        footerText: styles.footerText ?? undefined,
        dismissableNoticeText: styles.dismissableNoticeText ?? undefined,
        appearance: styles.appearance ?? "light",
        position: styles.alignChatButton === "left" ? "bottom-left" : "bottom-right",
        chatWidth: styles.chatWidth ?? "380px",
        chatHeight: styles.chatHeight ?? "580px",
        showButtonText: styles.showButtonText ?? false,
        buttonText: styles.buttonText ?? styles.widgetButtonText ?? "",
        autoShowInitial: false,
        autoShowDelaySec: 0,
        enableNewsFeed: false,
        enableVoice: false,
        pageContextEnabled: false,
        showAgentAvatars: true,
        collectUserFeedback: styles.collectUserFeedback ?? true,
        regenerateMessages: styles.regenerateMessages ?? true,
        continueSuggestedMessages: styles.continueShowingSuggestedMessages ?? false,
        suggestedMessages: response.partial.suggestedMessages ?? [],
        messagePopupEnabled: false,
        popupSoundEnabled: false,
        newsFeedItems: [],
        agents: [{ id: "1", name: styles.displayName ?? "Support", status: "online" }],
        chatbotId: chatbotId,
        testing: false,
    };
}

// ---------------------------------------------------------------------------
// Default script shown on first load
// ---------------------------------------------------------------------------
const DEFAULT_SCRIPT = JSON.stringify(
    [
        "Hi! How can I help you today?",
        "Sure, I can help you with that. Let me look into it.",
        [
            { type: "bot_message", content: "I'll connect you with one of our specialists right away." },
            { type: "escalate", reason: "needs specialist" },
        ],
        { type: "agent_message", content: "Hey! I'm Alex from the support team. How can I help?", agentName: "Alex" },
        { type: "show_lead_form" },
        { type: "resolve" },
    ] satisfies DemoScript,
    null,
    2
);

// ---------------------------------------------------------------------------
// Script reference block
// ---------------------------------------------------------------------------
const SCRIPT_REFERENCE = [
    { example: '"Plain bot reply"', note: "shorthand for bot_message" },
    { example: '{"type":"bot_message","content":"..."}', note: "streaming bot reply" },
    { example: '{"type":"agent_message","content":"...","agentName":"Sarah"}', note: "human agent message" },
    { example: '{"type":"escalate","reason":"..."}', note: "trigger escalation UI" },
    { example: '{"type":"show_lead_form"}', note: "show lead capture form" },
    { example: '{"type":"show_no_agents_form"}', note: "show offline contact form" },
    { example: '{"type":"resolve"}', note: "mark conversation as resolved" },
    { example: '[action1, action2, ...]', note: "array = multiple actions for one user message" },
];

const FALLBACK_CONFIG: WidgetConfig = {
    brandName: "Demo Bot",
    primaryColor: "#2D5A27",
    greeting: "Hi! How can I help?",
    placeholder: "Message...",
    appearance: "light",
    position: "bottom-right",
    showAgentAvatars: true,
    collectUserFeedback: true,
    regenerateMessages: false,
    agents: [{ id: "1", name: "Support", status: "online" }],
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
function DemoPageContent() {
    const [chatbotIdInput, setChatbotIdInput] = useState("t5eetmzucjp1o75lafl3duk3");
    const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>(FALLBACK_CONFIG);
    const [configLoading, setConfigLoading] = useState(false);
    const [configError, setConfigError] = useState<string | null>(null);
    const [configLoaded, setConfigLoaded] = useState(false);

    const [scriptJson, setScriptJson] = useState(DEFAULT_SCRIPT);
    const [activeScript, setActiveScript] = useState<DemoScript | null>(null);
    const [scriptError, setScriptError] = useState<string | null>(null);

    const [typingDelay, setTypingDelay] = useState(800);

    // Remount key — incrementing this resets the widget + queue
    const [widgetKey, setWidgetKey] = useState(0);
    // Track current step for the progress indicator
    const stepIndexRef = useRef(0);
    const [stepDisplay, setStepDisplay] = useState({ current: 0, total: 0 });

    const [showReference, setShowReference] = useState(false);

    // -----------------------------------------------------------------------
    // Config loading
    // -----------------------------------------------------------------------
    const handleLoadConfig = useCallback(async () => {
        const id = chatbotIdInput.trim();
        if (!id) return;
        setConfigLoading(true);
        setConfigError(null);
        try {
            const cfg = await loadConfig(id);
            setWidgetConfig(cfg);
            setConfigLoaded(true);
            // Reset widget so it picks up the new config cleanly
            setWidgetKey((k) => k + 1);
            stepIndexRef.current = 0;
            setStepDisplay({ current: 0, total: activeScript?.length ?? 0 });
        } catch (err) {
            setConfigError(err instanceof Error ? err.message : "Failed to load config");
        } finally {
            setConfigLoading(false);
        }
    }, [chatbotIdInput, activeScript]);

    // -----------------------------------------------------------------------
    // Script apply
    // -----------------------------------------------------------------------
    const handleApplyScript = useCallback(() => {
        try {
            const parsed = JSON.parse(scriptJson);
            if (!Array.isArray(parsed)) throw new Error("Script must be a JSON array");
            setActiveScript(parsed as DemoScript);
            setScriptError(null);
            // Reset widget + queue counter
            setWidgetKey((k) => k + 1);
            stepIndexRef.current = 0;
            setStepDisplay({ current: 0, total: parsed.length });
        } catch (err) {
            setScriptError(err instanceof Error ? err.message : "Invalid JSON");
        }
    }, [scriptJson]);

    // -----------------------------------------------------------------------
    // Reset chat (same script, fresh widget)
    // -----------------------------------------------------------------------
    const handleReset = useCallback(() => {
        setWidgetKey((k) => k + 1);
        stepIndexRef.current = 0;
        setStepDisplay({ current: 0, total: activeScript?.length ?? 0 });
    }, [activeScript]);

    // Intercept user sends to update the progress display
    // We wrap the ChatWidget's demoScript so we can observe queue progress.
    // The simplest way: track via a proxy script that calls setStepDisplay after each step.
    // For simplicity, we update the display whenever the widget key changes or script is applied.

    const totalSteps = activeScript?.length ?? 0;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top bar */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                <div>
                    <h1 className="font-semibold text-gray-900 text-base">Demo Mode</h1>
                    <p className="text-xs text-gray-500">Script scripted replies for marketing recordings</p>
                </div>
                <a
                    href="/test"
                    className="text-xs text-indigo-600 hover:underline"
                >
                    Switch to live test page →
                </a>
            </div>

            {/* Main layout */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── Left: Script Editor Panel ── */}
                <div className="w-[400px] shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
                    <div className="p-5 space-y-5">

                        {/* Chatbot config */}
                        <section>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                                Chatbot Config
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={chatbotIdInput}
                                    onChange={(e) => setChatbotIdInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleLoadConfig()}
                                    placeholder="Chatbot ID"
                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                />
                                <button
                                    onClick={handleLoadConfig}
                                    disabled={configLoading || !chatbotIdInput.trim()}
                                    className="px-3 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                                >
                                    {configLoading ? "Loading…" : "Load"}
                                </button>
                            </div>
                            {configError && (
                                <p className="mt-1.5 text-xs text-red-600">{configError}</p>
                            )}
                            {configLoaded && !configError && (
                                <p className="mt-1.5 text-xs text-green-600">
                                    Config loaded: <span className="font-medium">{widgetConfig.brandName}</span>
                                </p>
                            )}
                        </section>

                        {/* Typing delay */}
                        <section>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                                Typing Delay
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min={0}
                                    max={3000}
                                    step={100}
                                    value={typingDelay}
                                    onChange={(e) => setTypingDelay(Number(e.target.value))}
                                    className="flex-1 accent-indigo-600"
                                />
                                <span className="text-sm font-medium text-gray-700 w-16 text-right tabular-nums">
                                    {typingDelay === 0 ? "Off" : `${typingDelay} ms`}
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1">
                                How long the bot pauses before it starts typing a reply.
                            </p>
                        </section>

                        {/* Script editor */}
                        <section>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                                Script (JSON)
                            </label>
                            <textarea
                                value={scriptJson}
                                onChange={(e) => setScriptJson(e.target.value)}
                                rows={18}
                                spellCheck={false}
                                className="w-full px-3 py-2.5 text-xs font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 resize-none bg-gray-50"
                                placeholder="Paste your script JSON here…"
                            />
                            {scriptError && (
                                <p className="mt-1.5 text-xs text-red-600">{scriptError}</p>
                            )}
                            <button
                                onClick={handleApplyScript}
                                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                <Play className="w-3.5 h-3.5" />
                                Apply Script
                            </button>
                        </section>

                        {/* Queue status + Reset */}
                        {activeScript && (
                            <section className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500">Script loaded</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {totalSteps} step{totalSteps !== 1 ? "s" : ""}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Each user message plays the next step
                                    </p>
                                </div>
                                <button
                                    onClick={handleReset}
                                    title="Reset chat — restart from step 1"
                                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-sm text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Reset
                                </button>
                            </section>
                        )}

                        {/* Script reference (collapsible) */}
                        <section>
                            <button
                                onClick={() => setShowReference((v) => !v)}
                                className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide"
                            >
                                {showReference ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                Action Reference
                            </button>
                            {showReference && (
                                <div className="mt-2 space-y-2">
                                    {SCRIPT_REFERENCE.map((item, i) => (
                                        <div key={i} className="bg-gray-50 rounded p-2">
                                            <code className="text-[10px] text-indigo-700 break-all leading-relaxed">
                                                {item.example}
                                            </code>
                                            <p className="text-[10px] text-gray-500 mt-0.5">{item.note}</p>
                                        </div>
                                    ))}
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        Wrap multiple actions in <code className="text-indigo-600">[ ]</code> to fire them all
                                        for a single user message.
                                    </p>
                                </div>
                            )}
                        </section>
                    </div>
                </div>

                {/* ── Right: Widget Preview ── */}
                <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 p-8 gap-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                        Widget Preview — type any message to trigger the next script step
                    </p>

                    <div
                        className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200"
                        style={{ width: widgetConfig.chatWidth ?? "380px", height: widgetConfig.chatHeight ?? "580px" }}
                    >
                        <ChatWidget
                            key={widgetKey}
                            config={widgetConfig}
                            defaultOpen={true}
                            demoScript={activeScript ?? undefined}
                            demoTypingDelay={typingDelay}
                        />
                    </div>

                    {activeScript && (
                        <p className="text-xs text-gray-400">
                            {totalSteps} scripted step{totalSteps !== 1 ? "s" : ""} queued — reset to replay from the start
                        </p>
                    )}
                    {!activeScript && (
                        <p className="text-xs text-gray-400">
                            No script applied — widget is in live mode
                        </p>
                    )}
                </div>

            </div>
        </div>
    );
}

export default function DemoPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 text-sm">
                Loading…
            </div>
        }>
            <DemoPageContent />
        </Suspense>
    );
}
