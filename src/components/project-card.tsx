import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Project } from "@/lib/database";
import { FileText, Wrench, MoreVertical, Trash2 } from "lucide-react";

interface ProjectCardProps {
  project: Project;
  promptCount: number;
  toolCount: number;
  onClick: () => void;
  onDelete?: () => void;
}

export function ProjectCard({ project, promptCount, toolCount, onClick, onDelete }: ProjectCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    // Only trigger onClick if not clicking on the dropdown
    if (!(e.target as Element).closest('[data-dropdown-trigger]')) {
      onClick();
    }
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-elevated bg-gradient-card border-border/50 group">
      <div onClick={handleCardClick} className="cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold line-clamp-1">{project.name}</CardTitle>
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{project.description}</p>
              )}
            </div>
            {onDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild data-dropdown-trigger>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="opacity-60 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }} 
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{promptCount} prompts</span>
            </div>
            <div className="flex items-center gap-1">
              <Wrench className="h-4 w-4" />
              <span>{toolCount} tools</span>
            </div>
          </div>
          {project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {project.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{project.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}