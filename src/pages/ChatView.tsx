import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  Pencil,
  RefreshCw,
  Settings2,
  Sparkle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MarkdownPreview } from "@/components/markdown-preview";
import { ChatComposer } from "@/components/chat/chat-composer";
import { AttachPicker, type AttachPick } from "@/components/chat/attach-picker";
import { chatHelpers, type Chat, type ChatAttachment, type ChatMessage } from "@/lib/chats";
import { dbHelpers, type Prompt, type Project, type Tool } from "@/lib/database";
import { workflowHelpers, type Workflow as Flow } from "@/lib/workflows";
import { getAISettings, isAIReady, streamChat } from "@/lib/ai";
import { cn } from "@/lib/utils";

const SYSTEM_PROMPT =
  "You are PVault AI, a focused assistant that helps people run and refine their saved prompts. Be direct and useful. Use markdown when it helps readability.";

export default function ChatView() {
  const { projectId, chatId } = useParams<{ projectId: string; chatId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();

  const [project, setProject] = useState<Project | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);

  const [input, setInput] = useState("");
  const [pending, setPending] = useState<ChatAttachment[]>([]);
  const pendingText = useRef<Record<string, string>>({});
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const ready = isAIReady();
  const ai = getAISettings();

  // ---- load ------------------------------------------------------------
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    (async () => {
      const [projects, p, t, f] = await Promise.all([
        dbHelpers.getAllProjects(),
        dbHelpers.getProjectPrompts(projectId),
        dbHelpers.getProjectTools(projectId),
        workflowHelpers.getProjectWorkflows(projectId),
      ]);
      if (cancelled) return;
      setProject(projects.find((x) => x.id === projectId) ?? null);
      setPrompts(p);
      setTools(t);
      setFlows(f);

      let current: Chat | undefined;
      if (chatId && chatId !== "new") current = await chatHelpers.getChat(chatId);
      if (!current) {
        current = await chatHelpers.createChat(projectId);
        navigate(`/project/${projectId}/chat/${current.id}`, { replace: true });
      }
      setChat(current);

      // Seed from a prompt or flow passed through the URL.
      const seedPrompt = params.get("prompt");
      const seedFlow = params.get("flow");
      if (seedPrompt) {
        const found = p.find((x) => x.id === seedPrompt);
        if (found) {
          setInput(found.content);
          setPending([{ kind: "prompt", id: found.id, label: found.title || "Untitled" }]);
          pendingText.current[found.id] = found.content;
        }
      } else if (seedFlow) {
        const found = f.find((x) => x.id === seedFlow);
        if (found) {
          const text = [
            `Run this flow step by step: ${found.name}`,
            found.description || "",
            ...found.steps.map((s, i) => {
              const linked = s.kind === "prompt" ? p.find((x) => x.id === s.refId) : undefined;
              return `${i + 1}. ${s.label}${linked ? `\n${linked.content}` : s.note ? `\n${s.note}` : ""}`;
            }),
          ]
            .filter(Boolean)
            .join("\n\n");
          setInput(text);
          setPending([{ kind: "workflow", id: found.id, label: found.name }]);
          pendingText.current[found.id] = text;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, chatId]);

  // ---- autoscroll ------------------------------------------------------
  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    if (atBottom) scrollToBottom(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat?.messages.length, streamText]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 120);
  };

  // ---- sending ---------------------------------------------------------
  const run = useCallback(
    async (history: ChatMessage[], base: Chat) => {
      setStreaming(true);
      setStreamText("");
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const full = await streamChat(
          [
            { role: "system", content: SYSTEM_PROMPT },
            ...history.map((m) => ({ role: m.role, content: m.content })),
          ],
          (chunk) => setStreamText((t) => t + chunk),
          controller.signal,
        );
        const next: Chat = { ...base, messages: [...history, chatHelpers.newMessage("assistant", full)] };
        setChat(next);
        await chatHelpers.saveChat(next);
      } catch (e) {
        if ((e as Error).name === "AbortError") {
          const partial = streamTextRef.current;
          if (partial.trim()) {
            const next: Chat = { ...base, messages: [...history, chatHelpers.newMessage("assistant", partial)] };
            setChat(next);
            await chatHelpers.saveChat(next);
          }
        } else {
          toast({ title: "AI request failed", description: (e as Error).message, variant: "destructive" });
        }
      } finally {
        setStreaming(false);
        setStreamText("");
        abortRef.current = null;
      }
    },
    [toast],
  );

  const streamTextRef = useRef("");
  useEffect(() => {
    streamTextRef.current = streamText;
  }, [streamText]);

  const send = async () => {
    if (!chat || streaming) return;
    if (!ready) {
      navigate(`/ai?returnTo=${encodeURIComponent(`/project/${projectId}/chat/${chat.id}`)}`);
      return;
    }
    const text = input.trim();
    if (!text) return;

    const attachments = pending;
    const msg = chatHelpers.newMessage("user", text, attachments.length ? attachments : undefined);
    let base = chatHelpers.trackUsage(chat, attachments);
    if (!base.messages.length) {
      base = { ...base, title: text.slice(0, 48) || "New chat", model: ai.model };
    }
    const history = [...base.messages, msg];
    const withUser: Chat = { ...base, messages: history };
    setChat(withUser);
    await chatHelpers.saveChat(withUser);
    setInput("");
    setPending([]);
    setAtBottom(true);
    run(history, withUser);
  };

  const stop = () => abortRef.current?.abort();

  const regenerate = async (index: number) => {
    if (!chat || streaming) return;
    const history = chat.messages.slice(0, index);
    const trimmed: Chat = { ...chat, messages: history };
    setChat(trimmed);
    await chatHelpers.saveChat(trimmed);
    run(history, trimmed);
  };

  const saveEdit = async (index: number) => {
    if (!chat) return;
    const text = editDraft.trim();
    setEditingId(null);
    if (!text) return;
    const edited = { ...chat.messages[index], content: text };
    const history = [...chat.messages.slice(0, index), edited];
    const next: Chat = { ...chat, messages: history };
    setChat(next);
    await chatHelpers.saveChat(next);
    run(history, next);
  };

  const copy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1400);
  };

  const pick = (item: AttachPick) => {
    pendingText.current[item.id] = item.text;
    setPending((prev) => (prev.some((a) => a.id === item.id) ? prev : [...prev, { kind: item.kind, id: item.id, label: item.label }]));
    setInput((prev) => (prev.trim() ? `${prev.trim()}\n\n${item.text}` : item.text));
  };

  const removeAttachment = (id: string) => {
    const text = pendingText.current[id];
    setPending((prev) => prev.filter((a) => a.id !== id));
    if (text) setInput((prev) => prev.replace(text, "").replace(/\n{3,}/g, "\n\n").trim());
  };

  const messages = chat?.messages ?? [];
  const empty = messages.length === 0 && !streaming;
  const suggestions = useMemo(() => prompts.slice(0, 3), [prompts]);

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <header className="shrink-0 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center gap-2">
          <button
            onClick={() => navigate(`/project/${projectId}`)}
            aria-label="Back to project"
            className="shrink-0 h-8 w-8 -ml-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate leading-tight">{chat?.title || "New chat"}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {project?.name}
              {ready && ai.modelName ? ` · ${ai.modelName}` : ""}
            </p>
          </div>
          <button
            onClick={() => navigate(`/ai?returnTo=${encodeURIComponent(`/project/${projectId}/chat/${chatId}`)}`)}
            aria-label="AI settings"
            className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {empty && (
            <div className="pt-16 text-center">
              <div className="w-11 h-11 mx-auto rounded-2xl bg-secondary border border-border flex items-center justify-center mb-4">
                <Sparkle className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">Run a prompt</h2>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">
                Tap <span className="text-foreground">+</span> to pull in a saved prompt, flow or tool — then send.
              </p>
              {!ready && (
                <Button
                  className="rounded-full mt-5"
                  onClick={() =>
                    navigate(`/ai?returnTo=${encodeURIComponent(`/project/${projectId}/chat/${chatId}`)}`)
                  }
                >
                  Connect PVault AI
                </Button>
              )}
              {ready && suggestions.length > 0 && (
                <div className="mt-6 space-y-2 text-left">
                  {suggestions.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => pick({ kind: "prompt", id: p.id, label: p.title || "Untitled", text: p.content })}
                      className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-left hover:bg-secondary/60 transition-colors"
                    >
                      <p className="text-sm font-medium truncate">{p.title || "Untitled"}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{p.content}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={m.id} className="flex flex-col items-end gap-1.5">
                {editingId === m.id ? (
                  <div className="w-full rounded-3xl border border-border bg-card p-3">
                    <textarea
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      rows={Math.min(12, editDraft.split("\n").length + 1)}
                      className="w-full resize-none bg-transparent text-[15px] leading-relaxed focus:outline-none"
                    />
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                      <Button size="sm" className="rounded-full" onClick={() => saveEdit(i)}>
                        Send
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {m.attachments && m.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {m.attachments.map((a) => (
                          <span
                            key={a.id}
                            className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground"
                          >
                            <span className="text-primary capitalize">
                              {a.kind === "workflow" ? "flow" : a.kind}
                            </span>{" "}
                            {a.label}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="max-w-[85%] rounded-3xl bg-primary px-4 py-2.5 text-primary-foreground text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                      {m.content}
                    </div>
                    <div className="flex items-center gap-0.5 opacity-60">
                      <button
                        onClick={() => copy(m.id, m.content)}
                        aria-label="Copy message"
                        className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground"
                      >
                        {copiedId === m.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(m.id);
                          setEditDraft(m.content);
                        }}
                        aria-label="Edit message"
                        className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div key={m.id} className="space-y-1.5">
                <MarkdownPreview content={m.content} />
                <div className="flex items-center gap-0.5 opacity-60">
                  <button
                    onClick={() => copy(m.id, m.content)}
                    aria-label="Copy reply"
                    className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground"
                  >
                    {copiedId === m.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => regenerate(i)}
                    aria-label="Regenerate"
                    className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ),
          )}

          {streaming && (
            <div>
              {streamText ? (
                <MarkdownPreview content={streamText} />
              ) : (
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 relative bg-background">
        {!atBottom && (
          <button
            onClick={() => scrollToBottom()}
            aria-label="Scroll to latest"
            className="absolute -top-11 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-card border border-border text-muted-foreground flex items-center justify-center shadow-sm"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        )}
        <div className="max-w-2xl mx-auto px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          <ChatComposer
            value={input}
            onChange={setInput}
            onSend={send}
            onStop={stop}
            onAttach={() => setPickerOpen(true)}
            onExpand={() => setExpanded(true)}
            attachments={pending}
            onRemoveAttachment={removeAttachment}
            streaming={streaming}
            placeholder={ready ? "Message PVault AI…" : "Connect PVault AI to start…"}
          />
        </div>
      </div>

      <AttachPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        prompts={prompts}
        workflows={flows}
        tools={tools}
        onPick={pick}
      />

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-2xl h-[85vh] rounded-3xl p-0 flex flex-col gap-0">
          <DialogHeader className="px-5 py-4 border-b border-border flex-row items-center justify-between space-y-0">
            <DialogTitle className="text-base">Compose</DialogTitle>
            <button onClick={() => setExpanded(false)} aria-label="Close" className="text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </DialogHeader>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write your prompt…"
            className="flex-1 w-full resize-none bg-transparent px-5 py-4 text-[15px] leading-relaxed focus:outline-none"
          />
          <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
            <Button variant="ghost" className="rounded-full" onClick={() => setExpanded(false)}>
              Done
            </Button>
            <Button
              className="rounded-full"
              onClick={() => {
                setExpanded(false);
                send();
              }}
            >
              Send
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
