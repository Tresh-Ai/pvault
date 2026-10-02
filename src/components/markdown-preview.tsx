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
// Bolt Performance Optimization: Stable reference for remark plugins prevents
// ReactMarkdown from re-instantiating plugin pipelines on every keystroke/render.
const REMARK_PLUGINS = [remarkGfm, remarkBreaks];

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  return (
    <article className={cn("prose-pvault text-base leading-relaxed", className)}>
      <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>
        {content || "_Nothing to preview yet._"}
      </ReactMarkdown>
    </article>
  );
}
