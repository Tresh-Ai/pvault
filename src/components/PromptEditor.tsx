import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Prompt, PromptVersion, dbHelpers } from "@/lib/database";
import { ArrowLeft, Save, History, Check, Star, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const PROMPT_CATEGORIES = ["Writing", "Code", "Outreach", "Research", "Creative", "Analysis", "Other"];

export function PromptEditor() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const promptId = searchParams.get('promptId');
  const initialCategory = searchParams.get('category') || "Other";
  const initialFormat = (searchParams.get('format') as 'text' | 'json') || 'text';
  const isEdit = !!promptId;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [format, setFormat] = useState<'text' | 'json'>(initialFormat);
  const [tags, setTags] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [versions, setVersions] = useState<PromptVersion[]>([]);

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>();
  const { toast } = useToast();

  useEffect(() => {
    if (isEdit && promptId && projectId) {
      loadPrompt();
    } else {
      // Focus title on new prompt after mount
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [isEdit, promptId, projectId]);

  // Auto-grow title
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [title]);

  const loadPrompt = async () => {
    if (!promptId || !projectId) return;
    try {
      const prompts = await dbHelpers.getProjectPrompts(projectId);
      const prompt = prompts.find(p => p.id === promptId);
      if (prompt) {
        setTitle(prompt.title);
        setContent(prompt.content);
        setCategory(prompt.category);
        setFormat(prompt.format || 'text');
        setTags(prompt.tags);
        setIsFavorite(prompt.isFavorite);
        setVersions(prompt.versions || []);
      }
    } catch {
      toast({ title: "Error loading prompt", description: "Unable to load prompt data.", variant: "destructive" });
    }
  };

  const triggerAutosave = useCallback(async () => {
    if (!projectId || !title.trim() || !content.trim() || !isEdit || !promptId) return;
    try {
      await dbHelpers.autosavePrompt(promptId, { title, content });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      console.error('Autosave failed:', error);
    }
  }, [projectId, title, content, isEdit, promptId]);

  useEffect(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    if (title.trim() && content.trim() && isEdit) {
      setIsSaved(false);
      autosaveTimer.current = setTimeout(() => triggerAutosave(), 5000);
    }
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [title, content, triggerAutosave, isEdit]);

  // Extract hashtags from full content
  useEffect(() => {
    const t = setTimeout(() => {
      const matches = content.match(/#(\w+)/g) || [];
      setTags([...new Set(matches.map(tag => tag.slice(1)))]);
    }, 300);
    return () => clearTimeout(t);
  }, [content]);

  const handleSave = async () => {
    if (!projectId || !title.trim() || !content.trim()) {
      toast({ title: "Add a title & content", description: "Both are required to save.", variant: "destructive" });
      titleRef.current?.focus();
      return;
    }

    setIsLoading(true);
    try {
      if (isEdit && promptId) {
        await dbHelpers.updatePrompt(promptId, {
          title: title.trim(), content: content.trim(), category, format, tags, isFavorite,
        });
        toast({ title: "Saved", description: "Your prompt has been updated." });
      } else {
        await dbHelpers.createPrompt({
          projectId, title: title.trim(), content: content.trim(), category, format, tags, isFavorite,
        });
        toast({ title: "Saved", description: "Your prompt has been created." });
      }
      setIsSaved(true);
      navigate(`/project/${projectId}`);
    } catch {
      toast({ title: "Save failed", description: "Unable to save prompt.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
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
      await loadPrompt();
      setIsVersionsOpen(false);
      toast({ title: "Version restored" });
    } catch {
      toast({ title: "Restore failed", variant: "destructive" });
    }
  };

  const canSave = title.trim() && content.trim();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/project/${projectId}`)}
            className="shrink-0 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="text-sm">Back</span>
          </Button>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {isEdit && isSaved && (
              <span className="flex items-center gap-1 text-primary">
                <Check className="h-3 w-3" /> Saved
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFavorite(v => !v)}
              className={cn(isFavorite && "text-primary")}
              aria-label="Favorite"
            >
              <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
            </Button>
            {isEdit && (
              <Button variant="ghost" size="sm" onClick={handleViewVersions} aria-label="History">
                <History className="h-4 w-4" />
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={isLoading || !canSave}
              size="sm"
              className="rounded-full px-4"
            >
              <Save className="h-4 w-4 mr-1.5" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-5 pt-8 pb-32">
        {/* Title */}
        <textarea
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled prompt"
          rows={1}
          className={cn(
            "w-full resize-none bg-transparent outline-none border-0 p-0",
            "text-3xl sm:text-4xl font-semibold leading-tight tracking-tight",
            "placeholder:text-muted-foreground/40"
          )}
        />

        {/* Meta row */}
        <div className="mt-4 mb-6 flex items-center gap-2 flex-wrap">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-xs rounded-full border border-border bg-secondary px-3 py-1.5 outline-none hover:border-foreground/30 transition-colors cursor-pointer"
          >
            {PROMPT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as 'text' | 'json')}
            className="text-xs rounded-full border border-border bg-secondary px-3 py-1.5 outline-none hover:border-foreground/30 transition-colors cursor-pointer"
          >
            <option value="text">Text</option>
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

        {/* Divider */}
        <div className="h-px bg-border mb-6" />

        {/* Content */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your prompt here… Use #tags anywhere to organize."
          className={cn(
            "w-full min-h-[60vh] resize-none bg-transparent outline-none border-0 p-0",
            "text-base sm:text-lg leading-relaxed",
            "placeholder:text-muted-foreground/40 font-mono"
          )}
          style={{
            fontFamily: format === 'json'
              ? 'ui-monospace, SFMono-Regular, Menlo, monospace'
              : 'inherit',
          }}
        />
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
                    <p className="text-xs text-muted-foreground">{version.timestamp.toLocaleString()}</p>
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
