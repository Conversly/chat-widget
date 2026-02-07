/**
 * Layout for the embed page - minimal wrapper for iframe usage
 * Does NOT include html/body tags (they come from root layout)
 */
export default function EmbedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div style={{
            margin: 0,
            padding: 0,
            overflow: "hidden",
            backgroundColor: "transparent",
            width: "100%",
            height: "100vh"
        }}>
            {children}
        </div>
    );
}
