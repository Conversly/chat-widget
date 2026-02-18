export interface NudgeConfig {
    id: string;
    /**
     * URL pattern to match against current window.location.href
     */
    pattern: string;
    /**
     * How to match the pattern:
     * - 'exact': href === pattern
     * - 'contains': href.includes(pattern)
     * - 'regex': new RegExp(pattern).test(href)
     */
    matchType: 'exact' | 'contains' | 'regex';
    /**
     * Array of messages to show as bubbles.
     * Rendered in order from bottom to top above the launcher.
     */
    messages: string[];
    /**
     * Delay in ms before showing the nudge after match is confirmed.
     * Default: 1000ms
     */
    delay?: number;
}

export const NUDGE_CONFIG: NudgeConfig[] = [
    {
        id: 'test',
        pattern: '/test',
        matchType: 'contains',
        messages: [
            "👋 Hi! I can help you choose the right plan.",
            "Ask me anything about our pricing!"
        ],
        delay: 2000
    },
    // Example: Show pricing help on pricing page
    {
        id: 'pricing-help',
        pattern: '/pricing',
        matchType: 'contains',
        messages: [
            "👋 Hi! I can help you choose the right plan.",
            "Ask me anything about our pricing!"
        ],
        delay: 2000
    },
    // Example: Show features help on features or product pages
    {
        id: 'product-help',
        pattern: '/features',
        matchType: 'contains',
        messages: [
            "Curious about our features?",
            "I can give you a quick tour! 🚀"
        ],
        delay: 3000
    },
    // Add more rules here as needed by the user
];
