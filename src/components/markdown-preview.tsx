import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { cn } from "@/lib/utils";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

/** Sanitize link URLs to prevent XSS via javascript:, data:, vbscript: URIs. */
export function isSafeUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("vbscript:") ||
    trimmed.startsWith("file:")
  ) {
    return false;
  }
  try {
    const base = typeof window !== "undefined" && window.location ? window.location.href : "https://localhost";
    const parsed = new URL(url, base);
    return ["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol);
  } catch {
    return url.startsWith("/") || url.startsWith("#");
  }
}

/**
 * Renders markdown securely with GFM + soft line breaks.
 * Enforces target="_blank" and rel="noopener noreferrer" for external links
 * to prevent tabnabbing, and blocks unsafe URI protocols.
 */
export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  return (
    <article className={cn("prose-pvault text-base leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a({ href, children, ...props }) {
            if (!href || !isSafeUrl(href)) {
              return <span>{children}</span>;
            }
            const isExternal =
              href.startsWith("http://") ||
              href.startsWith("https://") ||
              href.startsWith("//");
            return (
              <a
                href={href}
                {...(isExternal
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                {...props}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content || "_Nothing to preview yet._"}
      </ReactMarkdown>
    </article>
  );
}
