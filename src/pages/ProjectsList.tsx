import { useState, useEffect } from "react";
import { Project, dbHelpers } from "@/lib/database";
import { ProjectCard } from "@/components/project-card";
import { SearchInput } from "@/components/ui/search-input";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "icon-192.png";

interface ProjectsList {
  onProjectSelect: (project: Project) => void;
  onSettingsClick: () => void;
}

export function ProjectsList({ onProjectSelect, onSettingsClick }: ProjectsList) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectTags, setNewProjectTags] = useState("");
  const [projectCounts, setProjectCounts] = useState<Record<string, { prompts: number; tools: number }>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const allProjects = await dbHelpers.getAllProjects();
      // Sort by updatedAt in reverse order
      allProjects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setProjects(allProjects);
      
      // Load counts for each project
      const counts: Record<string, { prompts: number; tools: number }> = {};
      for (const project of allProjects) {
        const projectPrompts = await dbHelpers.getProjectPrompts(project.id);
        const projectTools = await dbHelpers.getProjectTools(project.id);
        counts[project.id] = { prompts: projectPrompts.length, tools: projectTools.length };
      }
      setProjectCounts(counts);
    } catch (error) {
      toast({
        title: "Error loading projects",
        description: "Unable to load projects from database.",
        variant: "destructive",
      });
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const project = await dbHelpers.createProject({
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || undefined,
        tags: newProjectTags.split(',').map(tag => tag.trim()).filter(Boolean),
      });

      setProjects(prev => [project, ...prev]);
      setProjectCounts(prev => ({ ...prev, [project.id]: { prompts: 0, tools: 0 } }));
      
      setNewProjectName("");
      setNewProjectDescription("");
      setNewProjectTags("");
      setIsCreateDialogOpen(false);
      
      toast({
        title: "Project created",
        description: `${project.name} has been created successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error creating project",
        description: "Unable to create project.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project? This will also delete all prompts and tools in this project.')) {
      try {
        await dbHelpers.deleteProject(projectId);
        setProjects(prev => prev.filter(p => p.id !== projectId));
        setProjectCounts(prev => {
          const updated = { ...prev };
          delete updated[projectId];
          return updated;
        });
        
        toast({
          title: "Project deleted",
          description: "Project and all its contents have been deleted.",
        });
      } catch (error) {
        toast({
          title: "Error deleting project",
          description: "Unable to delete project.",
          variant: "destructive",
        });
      }
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src="/icon-192.png" alt="PVault" className="w-8 h-8 rounded-lg" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  PVault
                </h1>
                <p className="text-sm text-muted-foreground">Your AI memory, organized</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onSettingsClick}>
              <Settings className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search projects..."
              className="flex-1"
            />
            <FilterDropdown
              title="Filter projects"
              options={[
                { id: 'recent', label: 'Recently Updated', count: projects.filter(p => p.updatedAt && new Date(p.updatedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length },
                { id: 'old', label: 'Older Projects', count: projects.filter(p => !p.updatedAt || new Date(p.updatedAt).getTime() <= Date.now() - 7 * 24 * 60 * 60 * 1000).length }
              ].filter(option => option.count > 0)}
              selectedFilters={[]}
              onFiltersChange={() => {}}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 pb-24">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first project to start organizing your prompts and tools
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                promptCount={projectCounts[project.id]?.prompts || 0}
                toolCount={projectCounts[project.id]?.tools || 0}
                onClick={() => onProjectSelect(project)}
                onDelete={() => handleDeleteProject(project.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <FloatingActionButton onClick={() => setIsCreateDialogOpen(true)} />
        </DialogTrigger>
        <DialogContent className="w-[90vw] max-w-lg rounded-lg">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter project name"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="Describe what this project is about"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags (Optional)</Label>
              <Input
                id="tags"
                value={newProjectTags}
                onChange={(e) => setNewProjectTags(e.target.value)}
                placeholder="Enter tags separated by commas"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">Create Project</Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
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