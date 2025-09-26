import { useState, useEffect } from "react";
import { Project, Prompt, Tool, dbHelpers } from "@/lib/database";
import { PromptCard } from "@/components/prompt-card";
import { ToolCard } from "@/components/tool-card";
import { SearchInput } from "@/components/ui/search-input";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, FileText, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProjectViewProps {
  project: Project;
  onBack: () => void;
}

const PROMPT_CATEGORIES = ["Writing", "Code", "Outreach", "Research", "Creative", "Analysis", "Other"];
const TOOL_CATEGORIES = ["Image", "Text", "Video", "Workflow", "API", "Analytics", "Other"];

export function ProjectView({ project, onBack }: ProjectViewProps) {
  const [activeTab, setActiveTab] = useState("prompts");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatePromptOpen, setIsCreatePromptOpen] = useState(false);
  const [isCreateToolOpen, setIsCreateToolOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  
  // Prompt form state
  const [promptForm, setPromptForm] = useState({
    title: "",
    content: "",
    category: "",
    format: "text" as 'text' | 'json',
    tags: "",
    isFavorite: false,
  });

  // Tool form state
  const [toolForm, setToolForm] = useState({
    name: "",
    url: "",
    category: "",
    notes: "",
    tags: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [project.id]);

  const loadData = async () => {
    try {
      const [projectPrompts, projectTools] = await Promise.all([
        dbHelpers.getProjectPrompts(project.id),
        dbHelpers.getProjectTools(project.id),
      ]);
      setPrompts(projectPrompts);
      setTools(projectTools);
    } catch (error) {
      toast({
        title: "Error loading data",
        description: "Unable to load project data.",
        variant: "destructive",
      });
    }
  };

  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptForm.title.trim() || !promptForm.content.trim()) return;

    try {
      const prompt = await dbHelpers.createPrompt({
        projectId: project.id,
        title: promptForm.title.trim(),
        content: promptForm.content.trim(),
        category: promptForm.category || "Other",
        format: promptForm.format || "text",
        tags: promptForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        isFavorite: promptForm.isFavorite,
      });

      setPrompts(prev => [prompt, ...prev]);
      setPromptForm({ title: "", content: "", category: "", format: "text", tags: "", isFavorite: false });
      setIsCreatePromptOpen(false);
      
      toast({
        title: "Prompt created",
        description: "Your prompt has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error creating prompt",
        description: "Unable to create prompt.",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrompt || !promptForm.title.trim() || !promptForm.content.trim()) return;

    try {
      await dbHelpers.updatePrompt(editingPrompt.id, {
        title: promptForm.title.trim(),
        content: promptForm.content.trim(),
        category: promptForm.category || "Other",
        format: promptForm.format || "text",
        tags: promptForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        isFavorite: promptForm.isFavorite,
      });

      await loadData();
      setEditingPrompt(null);
      setPromptForm({ title: "", content: "", category: "", format: "text", tags: "", isFavorite: false });
      
      toast({
        title: "Prompt updated",
        description: "Your prompt has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error updating prompt",
        description: "Unable to update prompt.",
        variant: "destructive",
      });
    }
  };

  const handleCreateTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toolForm.name.trim()) return;

    try {
      const tool = await dbHelpers.createTool({
        projectId: project.id,
        name: toolForm.name.trim(),
        url: toolForm.url.trim(),
        category: toolForm.category || "Other",
        notes: toolForm.notes.trim() || undefined,
        tags: toolForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      });

      setTools(prev => [tool, ...prev]);
      setToolForm({ name: "", url: "", category: "", notes: "", tags: "" });
      setIsCreateToolOpen(false);
      
      toast({
        title: "Tool created",
        description: "Your tool has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error creating tool",
        description: "Unable to create tool.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePrompt = async (prompt: Prompt) => {
    try {
      await dbHelpers.deletePrompt(prompt.id);
      setPrompts(prev => prev.filter(p => p.id !== prompt.id));
      toast({
        title: "Prompt deleted",
        description: "Your prompt has been deleted.",
      });
    } catch (error) {
      toast({
        title: "Error deleting prompt",
        description: "Unable to delete prompt.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTool = async (tool: Tool) => {
    try {
      await dbHelpers.deleteTool(tool.id);
      setTools(prev => prev.filter(t => t.id !== tool.id));
      toast({
        title: "Tool deleted",
        description: "Your tool has been deleted.",
      });
    } catch (error) {
      toast({
        title: "Error deleting tool",
        description: "Unable to delete tool.",
        variant: "destructive",
      });
    }
  };

  const startEditPrompt = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setPromptForm({
      title: prompt.title,
      content: prompt.content,
      category: prompt.category,
      format: prompt.format || "text",
      tags: prompt.tags.join(', '),
      isFavorite: prompt.isFavorite,
    });
  };

  const startEditTool = (tool: Tool) => {
    setEditingTool(tool);
    setToolForm({
      name: tool.name,
      url: tool.url,
      category: tool.category,
      notes: tool.notes || "",
      tags: tool.tags.join(', '),
    });
  };

  const filteredPrompts = prompts.filter(prompt =>
    prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prompt.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-muted-foreground">{project.description}</p>
              )}
            </div>
          </div>
          
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={`Search ${activeTab}...`}
            className="w-full"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 mt-[10px]">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Prompts ({prompts.length})
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Tools ({tools.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prompts" className="pb-24">
          {filteredPrompts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No prompts yet</h3>
              <p className="text-muted-foreground mb-6">
                Add your first prompt to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPrompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onEdit={() => startEditPrompt(prompt)}
                  onDelete={() => handleDeletePrompt(prompt)}
                  onToggleFavorite={() => dbHelpers.togglePromptFavorite(prompt.id).then(loadData)}
                  onIncrementUsage={() => dbHelpers.incrementPromptUsage(prompt.id).then(loadData)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tools" className="pb-24">
          {filteredTools.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tools yet</h3>
              <p className="text-muted-foreground mb-6">
                Add your first tool to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onEdit={() => startEditTool(tool)}
                  onDelete={() => handleDeleteTool(tool)}
                  onIncrementUsage={() => dbHelpers.incrementToolUsage(tool.id).then(loadData)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* FAB */}
      <FloatingActionButton
        onClick={() => activeTab === "prompts" ? setIsCreatePromptOpen(true) : setIsCreateToolOpen(true)}
        icon={activeTab === "prompts" ? <FileText className="h-6 w-6" /> : <Wrench className="h-6 w-6" />}
      />

      {/* Create/Edit Prompt Dialog */}
      <Dialog 
        open={isCreatePromptOpen || !!editingPrompt} 
        onOpenChange={() => {
          setIsCreatePromptOpen(false);
          setEditingPrompt(null);
          setPromptForm({ title: "", content: "", category: "", format: "text", tags: "", isFavorite: false });
        }}
      >
        <DialogContent className="w-[90vw] max-w-lg rounded-lg">
          <DialogHeader>
            <DialogTitle>{editingPrompt ? "Edit Prompt" : "Create New Prompt"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={editingPrompt ? handleUpdatePrompt : handleCreatePrompt} className="space-y-4">
            <div>
              <Label htmlFor="prompt-title">Title</Label>
              <Input
                id="prompt-title"
                value={promptForm.title}
                onChange={(e) => setPromptForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter prompt title"
                required
              />
            </div>
            <div>
              <Label htmlFor="prompt-content">Content</Label>
              <Textarea
                id="prompt-content"
                value={promptForm.content}
                onChange={(e) => setPromptForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter your prompt content"
                rows={6}
                required
              />
            </div>
            <div>
              <Label htmlFor="prompt-category">Category</Label>
              <Select value={promptForm.category} onValueChange={(value) => setPromptForm(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {PROMPT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="prompt-format">Format</Label>
              <Select value={promptForm.format || 'text'} onValueChange={(value) => setPromptForm(prev => ({ ...prev, format: value as 'text' | 'json' }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="prompt-tags">Tags (Optional)</Label>
              <Input
                id="prompt-tags"
                value={promptForm.tags}
                onChange={(e) => setPromptForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Enter tags separated by commas"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingPrompt ? "Update Prompt" : "Create Prompt"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsCreatePromptOpen(false);
                  setEditingPrompt(null);
                  setPromptForm({ title: "", content: "", category: "", format: "text", tags: "", isFavorite: false });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Tool Dialog */}
      <Dialog 
        open={isCreateToolOpen || !!editingTool} 
        onOpenChange={() => {
          setIsCreateToolOpen(false);
          setEditingTool(null);
          setToolForm({ name: "", url: "", category: "", notes: "", tags: "" });
        }}
      >
        <DialogContent className="w-[90vw] max-w-lg rounded-lg">
          <DialogHeader>
            <DialogTitle>{editingTool ? "Edit Tool" : "Create New Tool"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTool} className="space-y-4">
            <div>
              <Label htmlFor="tool-name">Name</Label>
              <Input
                id="tool-name"
                value={toolForm.name}
                onChange={(e) => setToolForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter tool name"
                required
              />
            </div>
            <div>
              <Label htmlFor="tool-url">URL</Label>
              <Input
                id="tool-url"
                value={toolForm.url}
                onChange={(e) => setToolForm(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com"
                type="url"
              />
            </div>
            <div>
              <Label htmlFor="tool-category">Category</Label>
              <Select value={toolForm.category} onValueChange={(value) => setToolForm(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {TOOL_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tool-notes">Notes (Optional)</Label>
              <Textarea
                id="tool-notes"
                value={toolForm.notes}
                onChange={(e) => setToolForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add notes about this tool"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="tool-tags">Tags (Optional)</Label>
              <Input
                id="tool-tags"
                value={toolForm.tags}
                onChange={(e) => setToolForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Enter tags separated by commas"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingTool ? "Update Tool" : "Create Tool"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsCreateToolOpen(false);
                  setEditingTool(null);
                  setToolForm({ name: "", url: "", category: "", notes: "", tags: "" });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}