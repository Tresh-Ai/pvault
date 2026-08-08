import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Prompt, PromptVersion, dbHelpers } from "@/lib/database";
import { ArrowLeft, Save, History, Check, Star, Hash, Eye, PenLine, Loader2, Sparkle, ExternalLink, Braces } from "lucide-react";
import { MarkdownToolbar } from "@/components/markdown-toolbar";
import { MarkdownPreview } from "@/components/markdown-preview";
import { useEditorHistory } from "@/hooks/use-editor-history";
import { useToast } from "@/hooks/use-toast";
import { extractVariables, fillVariables, humanizeVariable } from "@/lib/variables";
import { cn } from "@/lib/utils";

const PROMPT_CATEGORIES = ["Writing", "Code", "Outreach", "Research", "Creative", "Analysis", "Other"];
type Format = 'text' | 'json' | 'markdown';

/** External AI tools we can hand a prompt to. `q` targets accept the text in the URL. */
const EXTERNAL_AI: { name: string; url: (text: string) => string; copy?: boolean }[] = [
  { name: "ChatGPT", url: (t) => `https://chatgpt.com/?q=${encodeURIComponent(t)}` },
  { name: "Claude", url: (t) => `https://claude.ai/new?q=${encodeURIComponent(t)}` },
  { name: "Gemini", url: () => "https://gemini.google.com/app", copy: true },
];


export function PromptEditor() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const initialPromptId = searchParams.get('promptId');
  const initialCategory = searchParams.get('category') || "Other";
  const initialFormat = (searchParams.get('format') as Format) || 'text';

  // The prompt id we're editing. Set once a new prompt is autosaved for the first time.
  const [promptId, setPromptId] = useState<string | null>(initialPromptId);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [format, setFormat] = useState<Format>(initialFormat);
  const [tags, setTags] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isPreview, setIsPreview] = useState(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [varValues, setVarValues] = useState<Record<string, string>>({});

  const [autosaveInterval, setAutosaveInterval] = useState(1200);

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>();
  const isDirty = useRef(false);
  const { toast } = useToast();

  // Undo / redo over title + content
  const applySnapshot = useCallback((s: { title: string; content: string }) => {
    isDirty.current = true;
    setTitle(s.title);
    setContent(s.content);
  }, []);
  const { undo, redo, reset: resetHistory, canUndo, canRedo } = useEditorHistory(
    { title, content },
    applySnapshot
  );

  // Autosave frequency from settings
  useEffect(() => {
    dbHelpers.getSettings().then(s => {
      if (typeof s.autosaveInterval === 'number') setAutosaveInterval(s.autosaveInterval);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (initialPromptId && projectId) {
      loadPrompt(initialPromptId);
    } else {
      setTimeout(() => titleRef.current?.focus(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPromptId, projectId]);

  // Auto-grow title
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [title, isPreview]);

  const loadPrompt = async (id: string) => {
    if (!projectId) return;
    try {
      const prompts = await dbHelpers.getProjectPrompts(projectId);
      const prompt = prompts.find(p => p.id === id);
      if (prompt) {
        setTitle(prompt.title);
        setContent(prompt.content);
        setCategory(prompt.category);
        setFormat((prompt.format as Format) || 'text');
        setTags(prompt.tags);
        setIsFavorite(prompt.isFavorite);
        setVersions(prompt.versions || []);
        resetHistory({ title: prompt.title, content: prompt.content });
      }
    } catch {
      toast({ title: "Error loading prompt", description: "Unable to load prompt data.", variant: "destructive" });
    }
  };

  const persist = useCallback(async (silent: boolean) => {
    if (!projectId) return null;
    if (!title.trim() && !content.trim()) return null;

    const payload = {
      title: title.trim() || "Untitled prompt",
      content: content.trim(),
      category,
      format,
      tags,
      isFavorite,
    };

    if (promptId) {
      if (silent) {
        await dbHelpers.autosavePrompt(promptId, { title: payload.title, content: payload.content });
        await dbHelpers.updatePrompt(promptId, { category, format, tags, isFavorite }, false);
      } else {
        await dbHelpers.updatePrompt(promptId, payload);
      }
      return promptId;
    }

    const created = await dbHelpers.createPrompt({ projectId, ...payload });
    setPromptId(created.id);
    return created.id;
  }, [projectId, promptId, title, content, category, format, tags, isFavorite]);

  // Debounced autosave - works for brand new prompts too
  useEffect(() => {
    if (!isDirty.current) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    if (autosaveInterval === 0) return;
    if (!title.trim() && !content.trim()) return;

    setSaveState('idle');
    autosaveTimer.current = setTimeout(async () => {
      try {
        setSaveState('saving');
        await persist(true);
        setSaveState('saved');
      } catch (error) {
        console.error('Autosave failed:', error);
        setSaveState('idle');
      }
    }, autosaveInterval);

    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [title, content, category, format, isFavorite, persist, autosaveInterval]);

  // Extract hashtags from full content
  useEffect(() => {
    const t = setTimeout(() => {
      const matches = content.match(/#(\w+)/g) || [];
      setTags([...new Set(matches.map(tag => tag.slice(1)))]);
    }, 300);
    return () => clearTimeout(t);
  }, [content]);

  // Save immediately without leaving the editor
  const handleSaveNow = async () => {
    if (!projectId || (!title.trim() && !content.trim())) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setSaveState('saving');
    try {
      await persist(false);
      setSaveState('saved');
      toast({ title: "Saved" });
    } catch {
      setSaveState('idle');
      toast({ title: "Save failed", variant: "destructive" });
    }
  };

  // Cmd/Ctrl+S saves immediately, Cmd/Ctrl+Z undo, +Shift redo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const key = e.key.toLowerCase();
      if (key === 's') {
        e.preventDefault();
        handleSaveNow();
      } else if (key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, title, content, category, format, tags, isFavorite, promptId, undo, redo]);

  const handleSave = async () => {
    if (!projectId || !title.trim() || !content.trim()) {
      toast({ title: "Add a title & content", description: "Both are required to save.", variant: "destructive" });
      titleRef.current?.focus();
      return;
    }
    setIsLoading(true);
    try {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      await persist(false);
      setSaveState('saved');
      toast({ title: "Saved", description: "Your prompt has been saved." });
      navigate(`/project/${projectId}`);
    } catch {
      toast({ title: "Save failed", description: "Unable to save prompt.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  /** Save, then hand the prompt to the built-in AI chat. */
  const runInPVaultAI = async () => {
    if (!projectId || !content.trim()) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    try {
      const id = await persist(false);
      if (id) await dbHelpers.incrementPromptUsage(id);
      const vars = Object.keys(filledValues).length
        ? `&vars=${encodeURIComponent(JSON.stringify(filledValues))}`
        : "";
      navigate(`/project/${projectId}/chat/new${id ? `?prompt=${id}${vars}` : ""}`);
    } catch {
      toast({ title: "Could not open the AI chat", variant: "destructive" });
    }
  };

  /** Hand the prompt to an external AI tool in a new tab. */
  const openExternal = async (target: typeof EXTERNAL_AI[number]) => {
    const text = resolvedContent.trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard may be blocked - the URL still carries the prompt */
    }
    if (promptId) dbHelpers.incrementPromptUsage(promptId).catch(() => {});
    window.open(target.url(text), "_blank", "noopener,noreferrer");
    if (target.copy) toast({ title: `Copied - paste it into ${target.name}` });
  };



  const handleViewVersions = async () => {
    if (!promptId) return;
    try {
      const promptVersions = await dbHelpers.getPromptVersions(promptId);
      setVersions(promptVersions);
      setIsVersionsOpen(true);
    } catch {
      toast({ title: "Error loading versions", variant: "destructive" });
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!promptId) return;
    try {
      await dbHelpers.restorePromptVersion(promptId, versionId);
      await loadPrompt(promptId);
      setIsVersionsOpen(false);
      toast({ title: "Version restored" });
    } catch {
      toast({ title: "Restore failed", variant: "destructive" });
    }
  };

  const markDirty = () => { isDirty.current = true; };
  const canSave = title.trim() && content.trim();
  const isMono = format === 'json';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="px-3 h-12 flex items-center justify-between gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/project/${projectId}`)}
            className="shrink-0 h-8 px-2"
            aria-label="Back to project"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>





          <div className="flex-1 flex justify-center text-xs text-muted-foreground">
            {saveState === 'saving' && (
              <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving</span>
            )}
            {saveState === 'saved' && (
              <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Saved</span>
            )}
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {format === 'markdown' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreview(v => !v)}
                className="h-8 px-2"
                aria-label={isPreview ? "Edit" : "Preview"}
              >
                {isPreview ? <PenLine className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { markDirty(); setIsFavorite(v => !v); }}
              className={cn("h-8 px-2", isFavorite && "text-primary")}
              aria-label="Favorite"
            >
              <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
            </Button>
            {promptId && (
              <Button variant="ghost" size="sm" onClick={handleViewVersions} className="h-8 px-2" aria-label="Version history">
                <History className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveNow}
              disabled={!title.trim() && !content.trim()}
              className="h-8 px-2"
              aria-label="Save now"
              title="Save now (Ctrl/Cmd + S)"
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || !canSave}
              size="sm"
              className="h-8 rounded-full px-3 text-xs"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Done
            </Button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-5 pt-7 pb-32">
        {/* Title */}
        <textarea
          ref={titleRef}
          value={title}
          onChange={(e) => { markDirty(); setTitle(e.target.value); }}
          placeholder="Untitled prompt"
          rows={1}
          aria-label="Prompt title"
          className={cn(
            "w-full resize-none bg-transparent outline-none focus:outline-none border-0 p-0 ring-0",
            "text-3xl sm:text-4xl font-semibold leading-tight tracking-tight",
            "placeholder:text-muted-foreground/40"
          )}
        />

        {/* Meta row */}
        <div className="mt-4 mb-5 flex items-center gap-2 flex-wrap">
          <select
            value={category}
            onChange={(e) => { markDirty(); setCategory(e.target.value); }}
            aria-label="Category"
            className="text-xs rounded-full bg-secondary px-3 py-1.5 border-0 outline-none focus:outline-none cursor-pointer"
          >
            {PROMPT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={format}
            onChange={(e) => { markDirty(); setFormat(e.target.value as Format); setIsPreview(false); }}
            aria-label="Format"
            className="text-xs rounded-full bg-secondary px-3 py-1.5 border-0 outline-none focus:outline-none cursor-pointer"
          >
            <option value="text">Text</option>
            <option value="markdown">Markdown</option>
            <option value="json">JSON</option>
          </select>
          {tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {tags.slice(0, 6).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs gap-0.5 rounded-full">
                  <Hash className="h-3 w-3" />{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Run this prompt */}
        <div className="mb-4 -mx-4 px-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={runInPVaultAI}
            disabled={!content.trim()}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium disabled:opacity-40"
          >
            <Sparkle className="h-3.5 w-3.5" /> Run in PVault AI
          </button>
          {EXTERNAL_AI.map((target) => (
            <button
              key={target.name}
              type="button"
              onClick={() => openExternal(target)}
              disabled={!content.trim()}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground disabled:opacity-40"
            >
              <ExternalLink className="h-3.5 w-3.5" /> {target.name}
            </button>
          ))}
        </div>

        {!isPreview && (
          <MarkdownToolbar
            textareaRef={contentRef}
            value={content}
            onChange={(next) => { markDirty(); setContent(next); }}
            showFormatting={format === 'markdown'}
            history={{ undo, redo, canUndo, canRedo }}
            className="mb-4"
          />
        )}


        <div className="h-px bg-border mb-5" />

        {/* Content / Preview */}
        {isPreview && format === 'markdown' ? (
          <MarkdownPreview content={content} className="min-h-[60vh]" />
        ) : (
          <textarea
            ref={contentRef}
            value={content}
            onChange={(e) => { markDirty(); setContent(e.target.value); }}
            placeholder={
              format === 'markdown'
                ? "Write in markdown… **bold**, # headings, - lists. Use #tags to organize."
                : "Write your prompt here… Use #tags anywhere to organize."
            }
            aria-label="Prompt content"
            className={cn(
              "w-full min-h-[60vh] resize-none bg-transparent outline-none focus:outline-none border-0 p-0 ring-0",
              "text-base sm:text-lg leading-relaxed",
              "placeholder:text-muted-foreground/40",
              isMono && "font-mono text-sm"
            )}
          />
        )}
      </div>

      {/* Version History Modal */}
      <Dialog open={isVersionsOpen} onOpenChange={setIsVersionsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {versions.map((version) => (
              <div key={version.versionId} className="p-4 border border-border rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{version.title}</h4>
                    <p className="text-xs text-muted-foreground">{new Date(version.timestamp).toLocaleString()}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleRestoreVersion(version.versionId)}>
                    Restore
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">{version.content}</p>
              </div>
            ))}
            {versions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No versions yet</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
