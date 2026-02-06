/**
 * UI Text Constants
 * Contains all static text values that are not configurable via UIConfigInput
 */
export const UI_TEXT = {
  // Feedback related
  feedback: {
    buttons: {
      good: "Good Answer",
      bad: "Bad Answer",
    },
    popover: {
      title: "Additional Feedback (Optional)",
      submitButton: "Submit",
      thankYouTooltip: "Thank you!",
    },
    positivePlaceholder: "How did the answer help you?",
    negativePlaceholder: "What was the issue with the answer? How could it be improved?",
    checkboxes: {
      incorrect: "Answer is incorrect",
      irrelevant: "Answer contains irrelevant details",
      unaddressed: "Answer didn't address my question",
    },
    infoText: "All feedback is reviewed by the team.",
  },

  // States and loading messages
  states: {
    loading: "Loading...",
    error: "Something went wrong",
    retry: "Try again",
    toolCancelled: "Tool execution was cancelled",
  },

  // Conversation controls
  conversation: {
    copy: "Copy",
    copied: "Copied!",
    copiedToClipboard: "Copied response to clipboard!",
    clear: "Clear",
  },

  // Input placeholders and labels
  input: {
    defaultPlaceholder: "Ask AI...",
    writePromptAriaLabel: "Write your prompt here",
  },

  // Button aria labels
  ariaLabels: {
    attachFile: "Attach a file",
    voiceInput: "Voice input",
    stopGenerating: "Stop generating",
    sendMessage: "Send message",
    close: "Close",
    copyToClipboard: "Copy to clipboard",
  },

  // Prompt suggestions
  prompts: {
    defaultLabel: "Try these prompts ✨",
  },

  // Interruption
  interrupt: {
    message: "Press Enter again to interrupt",
  },

  // File attachments
  files: {
    attachmentAlt: (fileName: string) => `Attachment ${fileName}`,
    pastedText: "Pasted text",
  },

  // CSAT (Customer Satisfaction)
  csat: {
    title: "We'd love your feedback!",
    question: "How helpful have you found the AI assistant so far?",
    commentPlaceholder: "Optional: anything you'd like to share",
    submitButton: "Submit Feedback",
    ratings: {
      veryUnhelpful: "Very unhelpful",
      unhelpful: "Unhelpful",
      neutral: "Neutral",
      helpful: "Helpful",
      veryHelpful: "Very helpful",
    },
  },

  // Consent
  consent: {
    title: "Hi there, do you want to use the AI chat?",
    disclaimer: "By clicking the 'I agree, let's chat' button, you agree to the necessary cookies. You can find more information in our privacy policy.",
    acceptButton: "I agree, let's chat!",
    rejectButton: "No, not interested",
  },

  // Footer
  footer: {
    poweredBy: (brand: string) => `Powered by ${brand}`,
  },

  // Captcha
  captcha: {
    protectedBy: (service: string) => `Protected by ${service}`,
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    recaptcha: {
      message: "This site is protected by {recaptchaLink} and the Google {privacyLink} and {termsLink} apply",
    },
    hcaptcha: {
      message: "This site is protected by {hcaptchaLink} and its {privacyLink} and {termsLink} apply",
    },
  },

  // Search (for future use)
  search: {
    inputPlaceholder: "Search sources...",
    askAICTA: "Ask AI instead",
    noResults: "No results found. Try rephrasing your query or asking the AI.",
    askAIPrefix: "Ask AI:",
    instantAnswer: "Get an instant AI answer",
  },

  // Ask AI features (for future use)
  askAI: {
    exampleQuestionsTitle: "Example Questions",
    sourcesLabel: "Sources",
    viewSources: "View Sources",
    deepThinking: "Deep thinking",
    deepThinkingDescription: "For harder questions. Searches longer across all sources. Takes up to ~1 minute.",
    deepThinkingCountdown: (seconds: number) => `Running deep thinking mode up to a minute. ${seconds}s…`,
    gatheringSources: "Gathering sources…",
    answerBasedOnSources: "Answer based on the following sources:",
  },
} as const;
