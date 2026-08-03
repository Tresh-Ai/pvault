import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FileText, Search, Workflow, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Prompt, Tool } from "@/lib/database";
import type { Workflow as Flow } from "@/lib/workflows";

export interface AttachPick {
  kind: "prompt" | "workflow" | "tool";
  id: string;
  label: string;
  text: string;
}

interface AttachPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompts: Prompt[];
  workflows: Flow[];
  tools: Tool[];
  onPick: (pick: AttachPick) => void;
}

const TABS = [
  { key: "prompt", label: "Prompts", icon: FileText },
  { key: "workflow", label: "Flows", icon: Workflow },
  { key: "tool", label: "Tools", icon: Wrench },
] as const;

export function AttachPicker({ open, onOpenChange, prompts, workflows, tools, onPick }: AttachPickerProps) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("prompt");
  const [query, setQuery] = useState("");

  const items: AttachPick[] = useMemo(() => {
    if (tab === "prompt") {
      return prompts.map((p) => ({ kind: "prompt" as const, id: p.id, label: p.title || "Untitled", text: p.content }));
    }
    if (tab === "workflow") {
      return workflows.map((w) => ({
        kind: "workflow" as const,
        id: w.id,
        label: w.name,
        text: [
          `Flow: ${w.name}`,
          w.description ? w.description : "",
          ...w.steps.map((s, i) => {
            const linked = s.kind === "prompt" ? prompts.find((p) => p.id === s.refId) : undefined;
            return `${i + 1}. ${s.label}${linked ? `\n${linked.content}` : s.note ? `\n${s.note}` : ""}`;
          }),
        ]
          .filter(Boolean)
          .join("\n\n"),
      }));
    }
    return tools.map((t) => ({
      kind: "tool" as const,
      id: t.id,
      label: t.name,
      text: [`Tool: ${t.name}`, t.url, t.notes].filter(Boolean).join("\n"),
    }));
  }, [tab, prompts, workflows, tools]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.label.toLowerCase().includes(q) || i.text.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base">Add to this chat</DialogTitle>
        </DialogHeader>

        <div className="px-5 space-y-3">
          <div className="flex gap-1 p-1 rounded-full bg-secondary">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "flex-1 h-8 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors",
                  tab === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="pl-9" />
          </div>
        </div>

        <div className="max-h-[45vh] overflow-y-auto px-5 pb-5 pt-3 space-y-1.5">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onPick(item);
                onOpenChange(false);
                setQuery("");
              }}
              className="w-full text-left rounded-xl px-3 py-2.5 hover:bg-secondary transition-colors"
            >
              <p className="text-sm font-medium truncate">{item.label}</p>
              <p className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-wrap">{item.text}</p>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-10">Nothing here yet.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
