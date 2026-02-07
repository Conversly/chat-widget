"use client";

import { ChatWidget } from "@/components/widget";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Demo Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Chat Widget Demo
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              A customizable, Cal.com-style chat widget with Home, Messages, and Chat views.
              Click the button in the bottom-right corner to try it out.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <FeatureCard
              title="Multi-View Navigation"
              description="Home screen with greeting, Messages list, and full Chat view with smooth transitions."
            />
            <FeatureCard
              title="Customizable Branding"
              description="Configure brand colors, logos, agent avatars, and greeting messages."
            />
            <FeatureCard
              title="News Feed Integration"
              description="Display announcements and updates on the home screen."
            />
            <FeatureCard
              title="Real-time Messaging"
              description="Beautiful message bubbles with timestamps, agent info, and typing indicators."
            />
            <FeatureCard
              title="Rich Input"
              description="Message input with emoji, attachments, images, and voice buttons."
            />
            <FeatureCard
              title="Dark Mode Support"
              description="Full light and dark theme support with CSS variables."
            />
          </div>

          {/* Configuration Example */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              Usage Example
            </h2>
            <pre className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 overflow-x-auto text-sm text-slate-800 dark:text-slate-200">
              {`import { ChatWidget } from "@/components/widget";

<ChatWidget
  config={{
    brandName: "Your Brand",
    primaryColor: "#2D5A27",
    greeting: "How can we help?",
    placeholder: "Message...",
    appearance: "light",
    position: "bottom-right",
    enableNewsFeed: true,
    agents: [
      { id: "1", name: "Support", status: "online" }
    ],
  }}
/>`}
            </pre>
          </div>
        </div>
      </main>

      {/* The Chat Widget */}
      <ChatWidget
        config={{
          brandName: "Cal.com",
          primaryColor: "#2D5A27",
          userName: "Raghvendra",
          greeting: "How can we help?",
          placeholder: "Message...",
          appearance: "light",
          position: "bottom-right",
          enableNewsFeed: true,
          showAgentAvatars: true,
          agents: [
            { id: "1", name: "Jose", status: "online" },
            { id: "2", name: "Sarah", status: "online" },
            { id: "3", name: "Mike", status: "away" },
          ],
          newsFeedItems: [
            {
              id: "1",
              title: "Cal.com v5.6",
              description:
                "Cal.com v5.6 - Advanced private links, Round-robin groups, API V1 deprecation announcement, and more...",
              version: "v5.6",
            },
          ],
        }}
      />
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
      <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-slate-600 dark:text-slate-300 text-sm">
        {description}
      </p>
    </div>
  );
}
