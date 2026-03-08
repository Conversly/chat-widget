import type { Meta, StoryObj } from "@storybook/react";
import {
  TimelineMessage,
  DateSeparator,
  AgentJoinedMessage,
  ChatStartedMessage,
  EscalationAssignedMessage,
} from "./TimelineMessage";

const meta: Meta<typeof TimelineMessage> = {
  title: "Widget/TimelineMessage",
  component: TimelineMessage,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Base timeline message
export const ChatStarted: Story = {
  args: {
    type: "chat_start",
    content: "Chat started",
    timestamp: new Date(),
  },
};

export const AgentJoined: Story = {
  args: {
    type: "agent_joined",
    content: "Michael joined the chat",
    timestamp: new Date(),
  },
};

export const AgentLeft: Story = {
  args: {
    type: "agent_left",
    content: "Sarah left the chat",
    timestamp: new Date(),
  },
};

export const EscalationRequested: Story = {
  args: {
    type: "escalation_requested",
    content: "Human agent requested",
    timestamp: new Date(),
  },
};

export const EscalationAssigned: Story = {
  args: {
    type: "escalation_assigned",
    content: "Michael was assigned to this chat",
    timestamp: new Date(),
  },
};

export const CustomEvent: Story = {
  args: {
    type: "custom",
    content: "This is a custom system message",
    timestamp: new Date(),
  },
};

// Date separator
export const Yesterday: StoryObj<typeof DateSeparator> = {
  render: () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return <DateSeparator date={yesterday} />;
  },
};

export const Today: StoryObj<typeof DateSeparator> = {
  render: () => <DateSeparator date={new Date()} />,
};

export const SpecificDate: StoryObj<typeof DateSeparator> = {
  render: () => <DateSeparator date={new Date("2024-03-15")} />,
};

// Specialized components
export const AgentJoinedComponent: StoryObj<typeof AgentJoinedMessage> = {
  render: () => <AgentJoinedMessage agentName="Michael Johnson" />,
};

export const ChatStartedComponent: StoryObj<typeof ChatStartedMessage> = {
  render: () => <ChatStartedMessage />,
};

export const EscalationAssignedComponent: StoryObj<typeof EscalationAssignedMessage> = {
  render: () => <EscalationAssignedMessage agentName="Sarah Smith" />,
};

// Full conversation view
export const FullConversation: StoryObj = {
  render: () => (
    <div className="w-[400px] bg-white p-4 space-y-1">
      {/* Yesterday date */}
      <DateSeparator date={new Date(Date.now() - 86400000)} />

      {/* Chat started */}
      <ChatStartedMessage />

      {/* Some regular messages as visual reference */}
      <div className="flex justify-start my-2">
        <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-[70%]">
          <p className="text-sm text-gray-800">Hi! How can I help you?</p>
          <span className="text-[10px] text-gray-400">2:30 PM</span>
        </div>
      </div>

      <div className="flex justify-end my-2">
        <div className="bg-blue-500 rounded-lg px-4 py-2 max-w-[70%]">
          <p className="text-sm text-white">I need help with my order</p>
          <span className="text-[10px] text-blue-100">2:32 PM</span>
        </div>
      </div>

      {/* Today date */}
      <DateSeparator date={new Date()} />

      {/* Escalation */}
      <TimelineMessage type="escalation_requested" content="Human agent requested" />

      {/* Agent joined */}
      <AgentJoinedMessage agentName="Michael" />

      {/* Human agent message */}
      <div className="flex justify-start my-2 items-start gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
          M
        </div>
        <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-[70%]">
          <p className="text-xs font-medium text-gray-600 mb-1">Michael</p>
          <p className="text-sm text-gray-800">Hi, I can help with your order!</p>
          <span className="text-[10px] text-gray-400">10:15 AM</span>
        </div>
      </div>

      <div className="flex justify-end my-2">
        <div className="bg-blue-500 rounded-lg px-4 py-2 max-w-[70%]">
          <p className="text-sm text-white">Great, thanks! Order #12345</p>
          <span className="text-[10px] text-blue-100">10:16 AM</span>
        </div>
      </div>

      {/* Chat ended */}
      <TimelineMessage type="chat_ended" content="Chat ended" />
    </div>
  ),
};
