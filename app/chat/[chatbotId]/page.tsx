import { EmbeddedWidget } from "@/components/widget";

interface ChatPageProps {
    params: Promise<{
        chatbotId: string;
    }>;
    searchParams: Promise<{
        testing?: string;
        playground?: string;
    }>;
}

export default async function ChatPage(props: ChatPageProps) {
    const searchParams = await props.searchParams;
    const params = await props.params;

    const isTesting = searchParams?.testing === "true";
    const isPlayground = searchParams?.playground === "true";

    return (
        <main className="w-full h-[100dvh] bg-white overflow-hidden">
            <EmbeddedWidget
                chatbotId={params?.chatbotId}
                testing={isTesting}
                playground={isPlayground}
                layoutMode="fullpage"
            />
        </main>
    );
}
