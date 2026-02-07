"use client";
// Force update: Cleaned version without shiki

import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

interface MarkdownRendererProps {
    children: string;
}

/**
 * CopyButton - Button to copy code to clipboard
 */
function CopyButton({ content }: { content: string }) {
    const { isCopied, handleCopy } = useCopyToClipboard({
        text: content,
        copyMessage: "Copied code to clipboard",
    });

    return (
        <button
            onClick={handleCopy}
            className="relative h-6 w-6 rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Copy to clipboard"
        >
            <div className="absolute inset-0 flex items-center justify-center">
                <Check
                    className={cn(
                        "h-4 w-4 transition-transform ease-in-out text-green-500",
                        isCopied ? "scale-100" : "scale-0"
                    )}
                />
            </div>
            <Copy
                className={cn(
                    "h-4 w-4 transition-transform ease-in-out",
                    isCopied ? "scale-0" : "scale-100"
                )}
            />
        </button>
    );
}

interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
    children: React.ReactNode;
    className?: string;
    language: string;
}

/**
 * CodeBlock - Code block with copy button (no async syntax highlighting for client component compatibility)
 */
function CodeBlock({
    children,
    className,
    language,
    ...restProps
}: CodeBlockProps) {
    const code =
        typeof children === "string"
            ? children
            : childrenTakeAllStringContents(children);

    const preClass = cn(
        "overflow-x-scroll rounded-md border bg-gray-50 dark:bg-gray-800 p-3 font-mono text-sm [scrollbar-width:none]",
        className
    );

    return (
        <div className="group/code relative mt-1.5 mb-0.5">
            <pre className={preClass} {...restProps}>
                <code className="text-gray-800 dark:text-gray-200">
                    {code}
                </code>
            </pre>

            <div className="invisible absolute right-2 top-2 flex space-x-1 rounded-lg p-1 opacity-0 transition-all duration-200 group-hover/code:visible group-hover/code:opacity-100">
                <CopyButton content={code} />
            </div>
        </div>
    );
}

/**
 * Extract all string contents from React children
 */
function childrenTakeAllStringContents(element: any): string {
    if (typeof element === "string") {
        return element;
    }

    if (element?.props?.children) {
        let children = element.props.children;

        if (Array.isArray(children)) {
            return children
                .map((child) => childrenTakeAllStringContents(child))
                .join("");
        } else {
            return childrenTakeAllStringContents(children);
        }
    }

    return "";
}

/**
 * Helper to create components with predefined classes
 */
function withClass(Tag: keyof React.JSX.IntrinsicElements, classes: string) {
    const Component = ({ node, ...props }: any) => (
        <Tag className={classes} {...props} />
    );
    Component.displayName = Tag as string;
    return Component;
}

/**
 * Custom component mappings for Markdown elements
 */
const COMPONENTS = {
    h1: withClass("h1", "text-2xl font-semibold mt-3 mb-1"),
    h2: withClass("h2", "font-semibold text-xl mt-2 mb-1"),
    h3: withClass("h3", "font-semibold text-lg mt-2 mb-1"),
    h4: withClass("h4", "font-semibold text-base mt-1"),
    h5: withClass("h5", "font-medium mt-1"),
    strong: withClass("strong", "font-semibold"),
    a: withClass("a", "text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-800"),
    blockquote: withClass("blockquote", "border-l-2 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400"),
    code: ({ children, className, node, ...rest }: any) => {
        const match = /language-(\w+)/.exec(className || "");
        return match ? (
            <CodeBlock className={className} language={match[1]} {...rest}>
                {children}
            </CodeBlock>
        ) : (
            <code
                className={cn(
                    "font-mono text-sm bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5"
                )}
                {...rest}
            >
                {children}
            </code>
        );
    },
    pre: ({ children }: any) => children,
    ol: withClass("ol", "list-decimal pl-5 my-1 space-y-0.5"),
    ul: withClass("ul", "list-disc pl-5 my-1 space-y-0.5"),
    li: withClass("li", "leading-relaxed"),
    table: withClass(
        "table",
        "w-full border-collapse overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700 my-2"
    ),
    th: withClass(
        "th",
        "border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-left font-semibold bg-gray-50 dark:bg-gray-800"
    ),
    td: withClass(
        "td",
        "border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-left"
    ),
    tr: withClass("tr", "m-0 border-t p-0 even:bg-gray-50 dark:even:bg-gray-800/50"),
    p: withClass("p", "whitespace-pre-wrap mb-1.5 last:mb-0 leading-relaxed"),
    hr: withClass("hr", "border-gray-200 dark:border-gray-700 my-2"),
};

/**
 * MarkdownRenderer - Renders markdown content with proper styling
 */
export function MarkdownRenderer({ children }: MarkdownRendererProps) {
    return (
        <div className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-sm">
            <Markdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
                {children}
            </Markdown>
        </div>
    );
}

export default MarkdownRenderer;
