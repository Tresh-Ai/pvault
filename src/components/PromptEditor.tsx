import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Prompt, PromptVersion, dbHelpers } from "@/lib/database";
import { ArrowLeft, Save, History, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const PROMPT_CATEGORIES = ["Writing", "Code", "Outreach", "Research", "Creative", "Analysis", "Other"];

export function PromptEditor() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const promptId = searchParams.get('promptId');
  const isEdit = !!promptId;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Other");
  const [format, setFormat] = useState<'text' | 'json'>('text');
  const [tags, setTags] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  
  const contentRef = useRef<HTMLTextAreaElement>(null);
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
    if (!projectId || !title.trim() || !content.trim()) return;
    
    try {
      if (isEdit && promptId) {
        await dbHelpers.autosavePrompt(promptId, { title, content });
      }
      setLastSaved(new Date());
    } catch (error) {
      console.error('Autosave failed:', error);
    }
  }, [projectId, title, content, isEdit, promptId]);

  // Debounced autosave
  useEffect(() => {
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }
    
    autosaveTimer.current = setTimeout(() => {
      triggerAutosave();
    }, 2000);

    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
    };
  }, [title, content, triggerAutosave]);

  // Extract tags from content using #hashtags
  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex) || [];
    return [...new Set(matches.map(tag => tag.slice(1)))]; // Remove # and deduplicate
  };

  // Update tags when content changes
  useEffect(() => {
    const extractedTags = extractHashtags(content);
    setTags(prevTags => {
      const manualTags = prevTags.filter(tag => !extractedTags.includes(tag));
      return [...new Set([...manualTags, ...extractedTags])];
    });
  }, [content]);

  // Highlight hashtags in content
  const highlightContent = (text: string) => {
    return text.replace(/#(\w+)/g, '<span class="bg-primary/20 text-primary px-1 rounded">$&</span>');
  };

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
      
      setLastSaved(new Date());
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
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(`/project/${projectId}`)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">
                  {isEdit ? "Edit Prompt" : "Create Prompt"}
                </h1>
                {lastSaved && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Saved {lastSaved.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewVersions}
                >
                  <History className="h-4 w-4 mr-1" />
                  Versions
                </Button>
              )}
              <Button 
                onClick={handleSave} 
                disabled={isLoading || !title.trim() || !content.trim()}
                size="sm"
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Title Input */}
        <div className="space-y-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your prompt title..."
            className="text-xl font-semibold border-none shadow-none px-0 focus-visible:ring-0"
          />
        </div>

        {/* Content Editor */}
        <div className="relative">
          <textarea
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your prompt here... Use #tags to organize your content."
            className={cn(
              "w-full min-h-[400px] p-6 text-base leading-relaxed",
              "border border-border rounded-lg resize-none",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "placeholder:text-muted-foreground bg-background"
            )}
          />
        </div>

        {/* Tags Display */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Category:</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROMPT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Format:</label>
            <Select value={format} onValueChange={(value) => setFormat(value as 'text' | 'json')}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
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