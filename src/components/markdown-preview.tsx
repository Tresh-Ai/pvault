import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { cn } from "@/lib/utils";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

/**
 * Renders markdown the same way exports do: GFM (tables, task lists,
 * strikethrough) plus soft line breaks preserved as <br>.
 */
export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  return (
    <article className={cn("prose-pvault text-base leading-relaxed", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
        {content || "_Nothing to preview yet._"}
      </ReactMarkdown>
    </article>
  );
}
