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


} as const;
