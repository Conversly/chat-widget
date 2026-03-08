"use client";

import { ChatView } from "@/components/widget/ChatView";
import type { Message } from "@/types/activity";
import type { WidgetConfig } from "@/types/chatbot";

/**
 * Test page for Timeline/Chat view UI
 * Run this page to see the WhatsApp-style timeline messages in action
 *
 * URL: /timeline-test
 */

// Example config
const testConfig: WidgetConfig = {
  brandName: "Support Team",
  primaryColor: "#2D5A27",
  greeting: "How can we help?",
  placeholder: "Type a message...",
  appearance: "light",
  position: "bottom-right",
  agents: [
    { id: "1", name: "Sarah (Bot)", status: "online" },
  ],
};

// Example conversation
const testConversation = {
  id: "test-conv-1",
  agent: {
    id: "1",
    name: "Support Bot",
    status: "online" as const,
  },
  lastMessage: "Chat ended",
  lastMessageTime: new Date(),
  unreadCount: 0,
};

// Test messages with timeline events interspersed
const testMessages: Message[] = [
  // Chat started - system event
  {
    id: "sys-1",
    role: "system",
    content: "Chat started",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  // Yesterday date separator
  {
    id: "date-1",
    role: "system",
    content: "Yesterday",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  // Agent's first message
  {
    id: "msg-1",
    role: "assistant",
    content: "Hi there! Welcome to our support chat. How can I help you today?",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 5000),
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 5000),
    status: "delivered",
  },
  // User response
  {
    id: "msg-2",
    role: "user",
    content: "I need help with my account settings",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 30000),
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 30000),
    status: "delivered",
  },
  // Agent response
  {
    id: "msg-3",
    role: "assistant",
    content: "I'd be happy to help! What specifically would you like to change in your account settings?",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 45000),
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 45000),
    status: "delivered",
  },
  // Today date separator
  {
    id: "date-2",
    role: "system",
    content: "Today",
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
  },
  // Escalation request
  {
    id: "sys-2",
    role: "system",
    content: "Human agent requested",
    createdAt: new Date(Date.now() - 1000 * 60 * 25),
    timestamp: new Date(Date.now() - 1000 * 60 * 25),
  },
  // Agent joined
  {
    id: "sys-3",
    role: "system",
    content: "Michael joined the chat",
    createdAt: new Date(Date.now() - 1000 * 60 * 20),
    timestamp: new Date(Date.now() - 1000 * 60 * 20),
  },
  // Human agent message
  {
    id: "msg-4",
    role: "agent",
    content: "Hi, I'm Michael from the accounts team. I can help you with your settings. What do you need to update?",
    createdAt: new Date(Date.now() - 1000 * 60 * 18),
    timestamp: new Date(Date.now() - 1000 * 60 * 18),
    status: "delivered",
  },
  // User message
  {
    id: "msg-5",
    role: "user",
    content: "I want to change my email address",
    createdAt: new Date(Date.now() - 1000 * 60 * 15),
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    status: "delivered",
  },
  // Agent response
  {
    id: "msg-6",
    role: "agent",
    content: "I can help with that! I'll need to verify your identity first. Can you confirm your current email address?",
    createdAt: new Date(Date.now() - 1000 * 60 * 10),
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    status: "delivered",
  },
  // User message (recent)
  {
    id: "msg-7",
    role: "user",
    content: "It's user@example.com",
    createdAt: new Date(Date.now() - 1000 * 60 * 2),
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
    status: "delivered",
  },
];

export default function TimelineTestPage() {
  const handleSendMessage = async (content: string) => {
    console.log("Message sent:", content);
    // In a real app, this would add the message to the list
  };

  const handleBack = () => {
    console.log("Back clicked");
  };

  const handleClose = () => {
    console.log("Close clicked");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Timeline UI Test</h1>
        <p className="text-gray-600 mb-8">
          This page demonstrates WhatsApp-style timeline messages including:
          <ul className="list-disc ml-6 mt-2">
            <li>Chat started event</li>
            <li>Date separators (Yesterday, Today)</li>
            <li>Agent joined notifications</li>
            <li>Escalation events</li>
            <li>Regular user and agent messages</li>
          </ul>
        </p>

        {/* Widget Container */}
        <div className="border rounded-lg shadow-lg overflow-hidden bg-white h-[700px]">
          <ChatView
            config={testConfig}
            conversation={testConversation}
            messages={testMessages}
            onSendMessage={handleSendMessage}
            onBack={handleBack}
            onClose={handleClose}
            assignedAgent={{
              displayName: "Michael",
              avatarUrl: null,
            }}
          />
        </div>
      </div>
    </div>
  );
}
