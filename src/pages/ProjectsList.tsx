import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Settings, Plus, Command, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { Newsletter } from "@/components/newsletter";
import { InstallPrompt } from "@/components/install-prompt";
import { openCommandPalette } from "@/components/command-palette";
import { workflowHelpers } from "@/lib/workflows";

interface ProjectsList {
  onProjectSelect?: (project: Project) => void;
  onSettingsClick?: () => void;
}

export function ProjectsList({ onProjectSelect, onSettingsClick }: ProjectsList = {}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectTags, setNewProjectTags] = useState("");
  const [projectCounts, setProjectCounts] = useState<Record<string, { prompts: number; tools: number }>>({});
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const startEditProject = (project: Project) => {
    setEditingProject(project);
    setNewProjectName(project.name);
    setNewProjectDescription(project.description || "");
    setNewProjectTags(project.tags.join(", "));
  };

  const resetForm = () => {
    setEditingProject(null);
    setNewProjectName("");
    setNewProjectDescription("");
    setNewProjectTags("");
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !newProjectName.trim()) return;

    try {
      await dbHelpers.updateProject(editingProject.id, {
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || undefined,
        tags: newProjectTags.split(',').map(tag => tag.trim()).filter(Boolean),
      });
      await loadProjects();
      resetForm();
      toast({ title: "Project updated" });
    } catch (error) {
      toast({
        title: "Error updating project",
        description: "Unable to update project.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project? This will also delete all prompts and tools in this project.')) {
      try {
        await dbHelpers.deleteProject(projectId);
        await workflowHelpers.deleteProjectWorkflows(projectId);
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
      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-5 pb-28">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Folder className="h-4 w-4" /> Projects
          </span>
          <span className="text-xs text-muted-foreground">{projects.length}</span>
        </div>


        {filteredProjects.length === 0 ? (
          <div className="text-center py-16 max-w-sm mx-auto">
            <div className="w-14 h-14 mx-auto bg-secondary rounded-xl flex items-center justify-center mb-5">
              <Plus className="h-6 w-6 text-primary" strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-semibold mb-2">No projects yet</h2>
            <p className="text-sm text-muted-foreground">
              A project holds the prompts, tools, flows and chats for one piece of work.
              Create your first one below.
            </p>
          </div>

        ) : (
          <div className="space-y-3">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                promptCount={projectCounts[project.id]?.prompts || 0}
                toolCount={projectCounts[project.id]?.tools || 0}
                onClick={() => (onProjectSelect ? onProjectSelect(project) : navigate(`/project/${project.id}`))}
                onEdit={() => startEditProject(project)}
                onDelete={() => handleDeleteProject(project.id)}
              />
            ))}
          </div>
        )}

        <div className="mt-8 space-y-4">
          <InstallPrompt />
          <Newsletter />
        </div>
      </div>


      {/* Create Project Dialog */}
      <Dialog
        open={isCreateDialogOpen || !!editingProject}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogTrigger asChild>
          <FloatingActionButton onClick={() => setIsCreateDialogOpen(true)} data-tour="fab" />
        </DialogTrigger>
        <DialogContent className="w-[90vw] max-w-lg rounded-lg">
          <DialogHeader>
            <DialogTitle>{editingProject ? "Edit Project" : "Create New Project"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={editingProject ? handleUpdateProject : handleCreateProject} className="space-y-4">
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
              <Button type="submit" className="flex-1">
                {editingProject ? "Save changes" : "Create Project"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}
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