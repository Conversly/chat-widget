"use client";

import { cn } from "@/lib/utils";

export type TimelineEventType = 
  | "chat_start"
  | "agent_joined"
  | "agent_left"
  | "chat_ended"
  | "escalation_requested"
  | "escalation_assigned"
  | "date_separator"
  | "custom";

export interface TimelineMessageProps {
  type: TimelineEventType;
  content: string;
  timestamp?: Date;
  className?: string;
}

/**
 * TimelineMessage - Renders system/timeline events centered in the chat
 * Similar to WhatsApp's system messages ("Chat started", "Today", etc.)
 */
export function TimelineMessage({
  type,
  content,
  timestamp,
  className,
}: TimelineMessageProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center my-2",
        className
      )}
    >
      <div
        className={cn(
          // Base styles
          "px-4 py-1.5 rounded-full",
          // Light background bubble
          "bg-gray-100/80",
          // Text styles - smaller and muted
          "text-xs font-medium text-gray-500",
          // Hover effect for subtle interactivity
          "hover:bg-gray-200/80 transition-colors",
          // Optional: Different styling for date separators vs events
          type === "date_separator" && "bg-gray-100/60 text-gray-400 font-normal",
          type === "chat_start" && "bg-blue-50/80 text-blue-600",
          type === "escalation_assigned" && "bg-green-50/80 text-green-600",
        )}
      >
        {content}
      </div>
    </div>
  );
}

/**
 * DateSeparator - Specialized component for date separators
 * Shows "Today", "Yesterday", or specific dates
 */
export function DateSeparator({ date }: { date: Date }) {
  const formatted = formatDateForSeparator(date);

  return (
    <div className="flex items-center justify-center my-2">
      <div className="px-3 py-1 bg-gray-100 rounded-md text-[11px] font-medium text-gray-400 uppercase tracking-wide">
        {formatted}
      </div>
    </div>
  );
}

/**
 * Formats a date for the separator display
 */
function formatDateForSeparator(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (dateDay.getTime() === today.getTime()) {
    return "Today";
  }

  if (dateDay.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }

  // For dates within the current year, show month and day
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: "long", day: "numeric" });
  }

  // For dates in different years, show full date
  return date.toLocaleDateString([], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * AgentJoinedMessage - Specialized component for agent joined events
 */
export function AgentJoinedMessage({
  agentName,
  className,
}: {
  agentName: string;
  className?: string;
}) {
  return (
    <TimelineMessage
      type="agent_joined"
      content={`${agentName} joined the chat`}
      className={className}
    />
  );
}

/**
 * ChatStartedMessage - Component for chat start event
 */
export function ChatStartedMessage({ className }: { className?: string }) {
  return (
    <TimelineMessage
      type="chat_start"
      content="Chat started"
      className={className}
    />
  );
}

/**
 * EscalationAssignedMessage - Component for escalation assignment
 */
export function EscalationAssignedMessage({
  agentName,
  className,
}: {
  agentName?: string;
  className?: string;
}) {
  return (
    <TimelineMessage
      type="escalation_assigned"
      content={agentName ? `${agentName} assigned to this chat` : "Human agent assigned"}
      className={className}
    />
  );
}
