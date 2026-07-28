import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Project } from "@/lib/database";
import { FileText, Wrench, MoreVertical, Trash2, ChevronRight } from "lucide-react";

interface ProjectCardProps {
  project: Project;
  promptCount: number;
  toolCount: number;
  onClick: () => void;
  onDelete?: () => void;
}

export function ProjectCard({ project, promptCount, toolCount, onClick, onDelete }: ProjectCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    if (!(e.target as Element).closest('[data-dropdown-trigger]')) onClick();
  };

  return (
    <div
      onClick={handleCardClick}
      className="group cursor-pointer rounded-2xl border border-border bg-card p-5 transition-all hover:border-foreground/20 hover:shadow-card active:scale-[0.995]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <h3 className="text-lg font-semibold tracking-tight truncate">{project.name}</h3>
          </div>
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> {promptCount}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Wrench className="h-3.5 w-3.5" /> {toolCount}
            </span>
            {project.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {project.tags.slice(0, 2).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-[10px] rounded-full px-2 py-0">{tag}</Badge>
                ))}
                {project.tags.length > 2 && (
                  <span className="text-[10px]">+{project.tags.length - 2}</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild data-dropdown-trigger>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </div>
  );
}
