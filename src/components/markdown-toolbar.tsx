import { RefObject } from "react";
import { Bold, Italic, Link2, Code, ListChecks, List, Heading2, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkdownToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (next: string) => void;
  className?: string;
}

type Action =
  | { kind: "wrap"; before: string; after: string; placeholder: string }
  | { kind: "line"; prefix: string; placeholder: string };

const actions: { icon: typeof Bold; label: string; action: Action }[] = [
  { icon: Bold, label: "Bold", action: { kind: "wrap", before: "**", after: "**", placeholder: "bold text" } },
  { icon: Italic, label: "Italic", action: { kind: "wrap", before: "_", after: "_", placeholder: "italic text" } },
  { icon: Link2, label: "Link", action: { kind: "wrap", before: "[", after: "](https://)", placeholder: "link text" } },
  { icon: Code, label: "Code", action: { kind: "wrap", before: "`", after: "`", placeholder: "code" } },
  { icon: Heading2, label: "Heading", action: { kind: "line", prefix: "## ", placeholder: "Heading" } },
  { icon: List, label: "Bullet list", action: { kind: "line", prefix: "- ", placeholder: "List item" } },
  { icon: ListChecks, label: "Checklist", action: { kind: "line", prefix: "- [ ] ", placeholder: "To do" } },
  { icon: Quote, label: "Quote", action: { kind: "line", prefix: "> ", placeholder: "Quote" } },
];

export function MarkdownToolbar({ textareaRef, value, onChange, className }: MarkdownToolbarProps) {
  const apply = (action: Action) => {
    const el = textareaRef.current;
    const start = el ? el.selectionStart : value.length;
    const end = el ? el.selectionEnd : value.length;
    const selected = value.slice(start, end);

    let next = value;
    let caretStart = start;
    let caretEnd = end;

    if (action.kind === "wrap") {
      const inner = selected || action.placeholder;
      const insert = action.before + inner + action.after;
      next = value.slice(0, start) + insert + value.slice(end);
      caretStart = start + action.before.length;
      caretEnd = caretStart + inner.length;
    } else {
      // Expand selection to whole lines, then prefix each line
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const lineEndIdx = value.indexOf("\n", end);
      const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;
      const block = value.slice(lineStart, lineEnd);
      const lines = (block || action.placeholder).split("\n");
      const prefixed = lines
        .map((line) => (line.startsWith(action.prefix) ? line : action.prefix + line))
        .join("\n");
      next = value.slice(0, lineStart) + prefixed + value.slice(lineEnd);
      caretStart = lineStart + prefixed.length;
      caretEnd = caretStart;
    }

    onChange(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(caretStart, caretEnd);
    });
  };

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 overflow-x-auto no-scrollbar rounded-full bg-secondary/60 p-1",
        className
      )}
      role="toolbar"
      aria-label="Markdown formatting"
    >
      {actions.map(({ icon: Icon, label, action }) => (
        <button
          key={label}
          type="button"
          title={label}
          aria-label={label}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => apply(action)}
          className="shrink-0 h-8 w-8 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
