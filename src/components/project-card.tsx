import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/lib/database";
import { FileText, Wrench } from "lucide-react";

interface ProjectCardProps {
  project: Project;
  promptCount: number;
  toolCount: number;
  onClick: () => void;
}

export function ProjectCard({ project, promptCount, toolCount, onClick }: ProjectCardProps) {
  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-elevated hover:scale-[1.02] bg-gradient-card border-border/50"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
        )}
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
              <Badge variant="secondary" className="text-xs">
                +{project.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}