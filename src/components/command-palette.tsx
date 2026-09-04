import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchEverything, type SearchResult, type SearchKind } from "@/lib/search";
import { FileText, Folder, GitBranch, MessageSquare, Wrench, Settings } from "lucide-react";

const KIND_META: Record<SearchKind, { icon: typeof FileText; label: string }> = {
  project: { icon: Folder, label: "Projects" },
  prompt: { icon: FileText, label: "Prompts" },
  tool: { icon: Wrench, label: "Tools" },
  flow: { icon: GitBranch, label: "Flows" },
  chat: { icon: MessageSquare, label: "Chats" },
};

const ORDER: SearchKind[] = ["project", "prompt", "flow", "tool", "chat"];

export function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    const onOpen = () => setOpen(true);
    window.addEventListener("pvault:open-search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pvault:open-search", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      return;
    }
    let active = true;
    const t = setTimeout(() => {
      searchEverything(query)
        .then((r) => active && setResults(r))
        .catch(() => active && setResults([]));
    }, 80);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query, open]);

  const grouped = useMemo(() => {
    const map = new Map<SearchKind, SearchResult[]>();
    results.forEach((r) => map.set(r.kind, [...(map.get(r.kind) || []), r]));
    return ORDER.filter((kind) => map.has(kind)).map((kind) => ({ kind, items: map.get(kind)! }));
  }, [results]);

  const go = (href: string) => {
    setOpen(false);
    navigate(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search projects, prompts, flows, tools, chats..."
      />
      <CommandList>
        {query.trim() ? (
          <>
            <CommandEmpty>Nothing matched "{query}".</CommandEmpty>
            {grouped.map(({ kind, items }) => {
              const Icon = KIND_META[kind].icon;
              return (
                <CommandGroup key={kind} heading={KIND_META[kind].label}>
                  {items.map((item) => (
                    <CommandItem
                      key={`${kind}-${item.id}`}
                      value={`${kind}-${item.id}-${item.title}`}
                      onSelect={() => go(item.href)}
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{item.title}</span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground truncate max-w-[45%]">
                        {item.projectName || item.subtitle}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </>
        ) : (
          <CommandGroup heading="Jump to">
            <CommandItem value="new chat" onSelect={() => go("/")} className="gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" /> New chat
            </CommandItem>
            <CommandItem value="projects" onSelect={() => go("/library/projects")} className="gap-2">
              <Folder className="h-4 w-4 text-muted-foreground" /> Projects
            </CommandItem>
            <CommandItem value="prompts" onSelect={() => go("/library/prompts")} className="gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" /> Prompts
            </CommandItem>
            <CommandItem value="settings" onSelect={() => go("/settings")} className="gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" /> Settings
            </CommandItem>
          </CommandGroup>

        )}
      </CommandList>
    </CommandDialog>
  );
}

export function openCommandPalette() {
  window.dispatchEvent(new Event("pvault:open-search"));
}
