import { useEffect, useRef } from "react";
import { ArrowUp, Maximize2, Plus, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatAttachment } from "@/lib/chats";

interface ChatComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onStop?: () => void;
  onAttach: () => void;
  onExpand: () => void;
  attachments: ChatAttachment[];
  onRemoveAttachment: (id: string) => void;
  streaming?: boolean;
  placeholder?: string;
}

const MAX_H = 200;

export function ChatComposer({
  value,
  onChange,
  onSend,
  onStop,
  onAttach,
  onExpand,
  attachments,
  onRemoveAttachment,
  streaming,
  placeholder = "Message PVault AI…",
}: ChatComposerProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_H)}px`;
    el.style.overflowY = el.scrollHeight > MAX_H ? "auto" : "hidden";
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (!streaming) onSend();
    }
  };

  const canSend = value.trim().length > 0 || attachments.length > 0;

  return (
    <div className="rounded-[26px] bg-secondary/70 border border-border/60 px-2 pt-2 pb-1.5">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-1.5 pb-2">
          {attachments.map((a) => (
            <span
              key={a.id}
              className="inline-flex items-center gap-1 max-w-[70%] rounded-full bg-background border border-border px-2 py-1 text-[11px]"
            >
              <span className="text-primary font-medium capitalize">{a.kind === "workflow" ? "flow" : a.kind}</span>
              <span className="truncate text-muted-foreground">{a.label}</span>
              <button onClick={() => onRemoveAttachment(a.id)} aria-label={`Remove ${a.label}`} className="shrink-0">
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </span>
          ))}
        </div>
      )}

      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full resize-none bg-transparent px-2 py-1.5 text-[15px] leading-relaxed placeholder:text-muted-foreground focus:outline-none"
      />

      <div className="flex items-center gap-1 pt-0.5">
        <button
          type="button"
          onClick={onAttach}
          aria-label="Add a prompt, flow or tool"
          title="Add a prompt, flow or tool"
          className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-[18px] w-[18px]" />
        </button>
        <button
          type="button"
          onClick={onExpand}
          aria-label="Open in full editor"
          title="Open in full editor"
          className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        <div className="flex-1" />
        {streaming ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop"
            className="h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center"
          >
            <Square className="h-3 w-3 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            aria-label="Send"
            className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
              canSend ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            <ArrowUp className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>
    </div>
  );
}
