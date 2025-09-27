import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

const TOOL_CATEGORIES = ["Image", "Text", "Video", "Workflow", "API", "Analytics", "Other"];

export function ProjectView({ project, onBack }: ProjectViewProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("prompts");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateToolOpen, setIsCreateToolOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);

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

  const handleUpdateTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTool || !toolForm.name.trim()) return;

    try {
      await dbHelpers.updateTool(editingTool.id, {
        name: toolForm.name.trim(),
        url: toolForm.url.trim(),
        category: toolForm.category || "Other",
        notes: toolForm.notes.trim() || undefined,
        tags: toolForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      });

      await loadData();
      setEditingTool(null);
      setToolForm({ name: "", url: "", category: "", notes: "", tags: "" });
      
      toast({
        title: "Tool updated",
        description: "Your tool has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error updating tool",
        description: "Unable to update tool.",
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

  const startEditTool = (tool: Tool) => {
    setEditingTool(tool);
    setToolForm({
      name: tool.name,
      url: tool.url || "",
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
                  onEdit={() => {}} // Handled by prompt card internally now
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
        onClick={() => activeTab === "prompts" ? navigate(`/project/${project.id}/prompt/new`) : setIsCreateToolOpen(true)}
        icon={activeTab === "prompts" ? <FileText className="h-6 w-6" /> : <Wrench className="h-6 w-6" />}
      />

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
          <form onSubmit={editingTool ? handleUpdateTool : handleCreateTool} className="space-y-4">
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