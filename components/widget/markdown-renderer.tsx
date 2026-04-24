"use client";
// Force update: Cleaned version without shiki

import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    Check,
    Copy,
    Download,
    FileArchive,
    FileAudio,
    FileCode,
    FileImage,
    FileSpreadsheet,
    FileText,
    FileVideo,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

const FILE_KIND = {
    image: new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico", "avif"]),
    video: new Set(["mp4", "webm", "mov", "avi", "mkv", "m4v", "ogv"]),
    audio: new Set(["mp3", "wav", "ogg", "m4a", "flac", "aac", "opus"]),
    pdf: new Set(["pdf"]),
    doc: new Set(["doc", "docx", "odt", "rtf", "txt", "md"]),
    sheet: new Set(["xls", "xlsx", "csv", "tsv", "ods"]),
    archive: new Set(["zip", "rar", "7z", "tar", "gz", "bz2"]),
    code: new Set(["js", "ts", "tsx", "jsx", "py", "rb", "go", "rs", "java", "c", "cpp", "h", "json", "xml", "yaml", "yml", "html", "css"]),
} as const;

function getFileInfo(href: string): { ext: string; kind: keyof typeof FILE_KIND | null } {
    try {
        const url = new URL(href, typeof window !== "undefined" ? window.location.href : "http://x");
        const pathname = url.pathname.toLowerCase();
        const match = pathname.match(/\.([a-z0-9]+)$/);
        const ext = match ? match[1] : "";
        for (const kind of Object.keys(FILE_KIND) as (keyof typeof FILE_KIND)[]) {
            if (FILE_KIND[kind].has(ext)) return { ext, kind };
        }
        return { ext, kind: null };
    } catch {
        return { ext: "", kind: null };
    }
}

const FILE_ICON: Record<keyof typeof FILE_KIND, React.ComponentType<{ className?: string }>> = {
    image: FileImage,
    video: FileVideo,
    audio: FileAudio,
    pdf: FileText,
    doc: FileText,
    sheet: FileSpreadsheet,
    archive: FileArchive,
    code: FileCode,
};

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
    img: ({ node, src, alt, ...props }: any) => {
        if (typeof src !== "string" || !src.trim()) return null;
        return (
            <a href={src} target="_blank" rel="noopener noreferrer" className="inline-block my-1.5">
                <img
                    src={src}
                    alt={alt || ""}
                    loading="lazy"
                    className="max-w-full h-auto rounded-md border border-gray-200 dark:border-gray-700"
                    {...props}
                />
            </a>
        );
    },
    a: ({ node, children, href, ...props }: any) => {
        const childText = typeof children === "string" ? children : "";
        const isRawUrl = childText.startsWith("http://") || childText.startsWith("https://");
        let displayText: React.ReactNode = children;
        if (isRawUrl) {
            try {
                const url = new URL(childText);
                const segments = url.pathname.split("/").filter(Boolean);
                displayText = segments.length > 0
                    ? segments[segments.length - 1].replace(/[-_]/g, " ")
                    : url.hostname;
            } catch {
                displayText = children;
            }
        }

        // Resolve href safely. If invalid / empty, render as plain text.
        let resolvedHref: string | null = null;
        if (typeof href === "string" && href.trim()) {
            const trimmed = href.trim();
            try {
                resolvedHref = new URL(trimmed).href;
            } catch {
                try {
                    const base = (typeof window !== "undefined" && window.parent !== window)
                        ? document.referrer || window.location.origin
                        : window.location.origin;
                    resolvedHref = new URL(trimmed, base).href;
                } catch {
                    resolvedHref = null;
                }
            }
        }

        const fileInfo = resolvedHref ? getFileInfo(resolvedHref) : { ext: "", kind: null };

        // Inline preview for media file links
        if (resolvedHref && fileInfo.kind === "image") {
            return (
                <a href={resolvedHref} target="_blank" rel="noopener noreferrer" className="inline-block my-1.5">
                    <img
                        src={resolvedHref}
                        alt={typeof childText === "string" ? childText : ""}
                        loading="lazy"
                        className="max-w-full h-auto rounded-md border border-gray-200 dark:border-gray-700"
                    />
                </a>
            );
        }
        if (resolvedHref && fileInfo.kind === "video") {
            return (
                <video controls preload="metadata" className="max-w-full h-auto rounded-md border border-gray-200 dark:border-gray-700 my-1.5">
                    <source src={resolvedHref} />
                </video>
            );
        }
        if (resolvedHref && fileInfo.kind === "audio") {
            return (
                <audio controls preload="metadata" className="max-w-full my-1.5">
                    <source src={resolvedHref} />
                </audio>
            );
        }

        // File attachment chip for downloadable file types
        if (resolvedHref && fileInfo.kind) {
            const Icon = FILE_ICON[fileInfo.kind];
            const fileName = (() => {
                try {
                    const segs = new URL(resolvedHref).pathname.split("/").filter(Boolean);
                    return segs[segs.length - 1] || resolvedHref;
                } catch {
                    return resolvedHref;
                }
            })();
            return (
                <a
                    href={resolvedHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center gap-2 max-w-full my-1 px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 no-underline"
                    title={resolvedHref}
                    {...props}
                >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate text-sm">{displayText || fileName}</span>
                    <Download className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                </a>
            );
        }

        const iconSvg = (
            <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 1H2C1.44772 1 1 1.44772 1 2V10C1 10.5523 1.44772 11 2 11H10C10.5523 11 11 10.5523 11 10V7M7 1H11M11 1V5M11 1L5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        );

        if (!resolvedHref) {
            return (
                <span className="inline-flex items-center gap-1 text-gray-500 underline underline-offset-2 break-all" {...props}>
                    {iconSvg}
                    {displayText}
                </span>
            );
        }

        return (
            <a
                href={resolvedHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                    e.stopPropagation();
                    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
                        return;
                    }
                    try {
                        window.open(resolvedHref!, "_blank", "noopener,noreferrer");
                        e.preventDefault();
                    } catch {
                        // fall through to default anchor behavior
                    }
                }}
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline underline-offset-2 break-all cursor-pointer"
                title={resolvedHref}
                {...props}
            >
                {iconSvg}
                {displayText}
            </a>
        );
    },
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
