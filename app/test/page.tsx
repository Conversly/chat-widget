"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";

/**
 * Test Page - For testing widget with dynamic chatbotId
 * 
 * Usage:
 * - /test?chatbotId=YOUR_CHATBOT_ID  - Load with specific chatbot
 * - /test                            - Shows input form to enter chatbotId
 */
function TestPageContent() {
    const searchParams = useSearchParams();
    const [inputValue, setInputValue] = useState("t5eetmzucjp1o75lafl3duk3");
    const [chatbotId, setChatbotId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Initialize from URL
    useEffect(() => {
        const idFromUrl = searchParams.get("chatbotId");
        if (idFromUrl) {
            setInputValue(idFromUrl);
            setChatbotId(idFromUrl);
            setIsLoaded(true);
        }
    }, [searchParams]);

    const handleLoadWidget = () => {
        if (!inputValue.trim()) return;
        setChatbotId(inputValue);
        setIsLoaded(true);
    };

    const handleReset = () => {
        setChatbotId(null);
        setIsLoaded(false);
        setInputValue("");

        // Cleanup widget
        const cleanupTypes = ['verly-chat-container', 'verly-chat-launcher'];
        cleanupTypes.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });

        // Remove global object
        // @ts-ignore
        delete window.ChatWidget;
    };

    // Inject embed.js script when loaded
    useEffect(() => {
        if (!isLoaded || !chatbotId) return;

        // Cleanup any existing widget elements first
        const cleanupTypes = ['verly-chat-container', 'verly-chat-launcher'];
        cleanupTypes.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });

        // Create and inject script
        const script = document.createElement("script");
        script.src = "/embed.js";
        script.setAttribute("data-chatbot-id", chatbotId);
        script.setAttribute("data-primary-color", "#4F46E5"); // Indigo-600
        script.async = true;

        document.body.appendChild(script);

        return () => {
            // Cleanup on unmount or ID change
            cleanupTypes.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.remove();
            });
            if (script.parentNode) script.parentNode.removeChild(script);
            // Remove global object if exists
            // @ts-ignore
            delete window.ChatWidget;
        };
    }, [isLoaded, chatbotId]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold text-gray-900">
                        Widget Testing
                    </h1>
                    <p className="text-lg text-gray-600">
                        Test the chat widget with any chatbot configuration
                    </p>
                </div>

                {/* Configuration Panel */}
                <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
                    <h2 className="text-2xl font-semibold text-gray-800">Configuration</h2>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="chatbotId" className="block text-sm font-medium text-gray-700 mb-2">
                                Chatbot ID
                            </label>
                            <div className="flex gap-3">
                                <input
                                    id="chatbotId"
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    // onKeyDown={(e) => e.key === "Enter" && handleLoadWidget()}
                                    placeholder="e.g., t5eetmzucjp1o75lafl3duk3"
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                />
                                <button
                                    onClick={handleLoadWidget}
                                    disabled={!inputValue.trim()}
                                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Load Widget
                                </button>
                                {isLoaded && (
                                    <button
                                        onClick={handleReset}
                                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Status */}
                        {isLoaded && (
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-sm text-green-800">
                                    <strong>✓ Widget Script Injected</strong> for chatbot ID: <code className="bg-green-100 px-2 py-1 rounded">{chatbotId}</code>
                                </p>
                                <p className="text-xs text-green-700 mt-1">Look for the launcher button in the bottom right corner.</p>
                            </div>
                        )}
                    </div>

                    {/* Tips */}
                    <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                        <p className="text-sm text-indigo-900">
                            <strong>Tip:</strong> You can also pass the chatbot ID directly in the URL:
                        </p>
                        <code className="block mt-2 bg-indigo-100 px-3 py-2 rounded text-sm text-indigo-800">
                            /test?chatbotId=your-chatbot-id
                        </code>
                    </div>
                </div>

                {/* Features List */}
                <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
                    <h2 className="text-2xl font-semibold text-gray-800">What gets loaded</h2>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                        <li className="flex items-start gap-2">
                            <span className="text-indigo-600 font-bold">✓</span>
                            <span>Hybrid Architecture (Native Button)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-indigo-600 font-bold">✓</span>
                            <span>Lazy Iframe Loading</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default function TestPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-gray-600">Loading...</div>
            </div>
        }>
            <TestPageContent />
        </Suspense>
    );
}
