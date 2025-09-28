import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Prompt, PromptVersion, dbHelpers } from "@/lib/database";
import { ArrowLeft, Save, History, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  
  const contentRef = useRef<HTMLDivElement>(null);
  const autosaveTimer = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Load existing prompt if editing
  useEffect(() => {
    if (isEdit && promptId && projectId) {
      loadPrompt();
    }
  }, [isEdit, promptId, projectId]);

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
    } catch (error) {
      toast({
        title: "Error loading prompt",
        description: "Unable to load prompt data.",
        variant: "destructive",
      });
    }
  };

  // Auto-save functionality
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

  // Debounced autosave
  useEffect(() => {
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }
    
    if (title.trim() && content.trim() && isEdit) {
      setIsSaved(false);
      autosaveTimer.current = setTimeout(() => {
        triggerAutosave();
      }, 2000);
    }

    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
    };
  }, [title, content, triggerAutosave, isEdit]);

  // Extract tags from content using #hashtags
  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex) || [];
    return [...new Set(matches.map(tag => tag.slice(1)))]; // Remove # and deduplicate
  };

  // Update tags when content changes - debounced
  useEffect(() => {
    const tagTimer = setTimeout(() => {
      const extractedTags = extractHashtags(content);
      setTags(extractedTags);
    }, 300);

    return () => clearTimeout(tagTimer);
  }, [content]);

  // Handle content changes from contenteditable
  const handleContentChange = () => {
    if (contentRef.current) {
      const text = contentRef.current.textContent || '';
      setContent(text);
    }
  };

  // Apply hashtag highlighting
  const applyHashtagHighlighting = () => {
    if (!contentRef.current) return;
    
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const startOffset = range?.startOffset || 0;
    
    const text = contentRef.current.textContent || '';
    const highlightedHTML = text.replace(
      /#(\w+)/g, 
      '<span class="bg-primary/20 text-primary px-1 rounded-sm">#$1</span>'
    );
    
    contentRef.current.innerHTML = highlightedHTML;
    
    // Restore cursor position
    if (selection && range) {
      try {
        const newRange = document.createRange();
        const textNode = contentRef.current.childNodes[0];
        if (textNode) {
          newRange.setStart(textNode, Math.min(startOffset, textNode.textContent?.length || 0));
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      } catch (e) {
        // Ignore cursor positioning errors
      }
    }
  };

  // Apply highlighting after content updates
  useEffect(() => {
    const timer = setTimeout(applyHashtagHighlighting, 100);
    return () => clearTimeout(timer);
  }, [content]);

  const handleSave = async () => {
    if (!projectId || !title.trim() || !content.trim()) {
      toast({
        title: "Validation error",
        description: "Title and content are required.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isEdit && promptId) {
        await dbHelpers.updatePrompt(promptId, {
          title: title.trim(),
          content: content.trim(),
          category,
          format,
          tags,
          isFavorite,
        });
        toast({
          title: "Prompt updated",
          description: "Your prompt has been saved successfully.",
        });
      } else {
        await dbHelpers.createPrompt({
          projectId,
          title: title.trim(),
          content: content.trim(),
          category,
          format,
          tags,
          isFavorite,
        });
        toast({
          title: "Prompt created",
          description: "Your prompt has been saved successfully.",
        });
      }
      
      setIsSaved(true);
      navigate(`/project/${projectId}`);
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Unable to save prompt.",
        variant: "destructive",
      });
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
    } catch (error) {
      toast({
        title: "Error loading versions",
        description: "Unable to load version history.",
        variant: "destructive",
      });
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!promptId) return;
    
    try {
      await dbHelpers.restorePromptVersion(promptId, versionId);
      await loadPrompt(); // Reload the prompt data
      setIsVersionsOpen(false);
      toast({
        title: "Version restored",
        description: "The selected version has been restored.",
      });
    } catch (error) {
      toast({
        title: "Restore failed",
        description: "Unable to restore version.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(`/project/${projectId}`)}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-base font-semibold truncate">
                {isEdit ? "Edit Prompt" : "Create Prompt"}
              </h1>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {isEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewVersions}
                  className="hidden sm:flex"
                >
                  <History className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Versions</span>
                </Button>
              )}
              <Button 
                onClick={handleSave} 
                disabled={isLoading || !title.trim() || !content.trim()}
                size="sm"
                className="min-w-[4rem]"
              >
                {isSaved ? (
                  <>
                    <Check className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Saved</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Save</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6 min-h-[calc(100vh-80px)]">
        {/* Title Input */}
        <div className="mb-6">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled prompt..."
            className="w-full text-xl sm:text-2xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/60 resize-none"
            style={{ fontFamily: 'inherit' }}
          />
        </div>

        {/* Content Editor */}
        <div className="relative min-h-[500px]">
          <div
            ref={contentRef}
            contentEditable
            onInput={handleContentChange}
            onBlur={applyHashtagHighlighting}
            data-placeholder="Write your prompt here... Use #tags to organize your content."
            className={cn(
              "w-full min-h-[500px] p-0 text-base sm:text-lg leading-relaxed",
              "outline-none resize-none",
              "placeholder:text-muted-foreground/60 bg-transparent",
              "prose prose-lg max-w-none",
              "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground/60 [&:empty]:before:pointer-events-none"
            )}
            style={{ 
              fontFamily: 'inherit',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          />
        </div>
      </div>

      {/* Version History Modal */}
      <Dialog open={isVersionsOpen} onOpenChange={setIsVersionsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {versions.map((version, index) => (
              <div
                key={version.versionId}
                className="p-4 border border-border rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{version.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {version.timestamp.toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestoreVersion(version.versionId)}
                  >
                    Restore
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {version.content}
                </p>
              </div>
            ))}
            {versions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No versions available
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}