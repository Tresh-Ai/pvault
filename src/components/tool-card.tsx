import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tool } from "@/lib/database";
import { ExternalLink, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ToolCardProps {
  tool: Tool;
  onEdit: () => void;
  onDelete: () => void;
}

export function ToolCard({ tool, onEdit, onDelete }: ToolCardProps) {
  const handleOpenLink = () => {
    if (tool.url) {
      window.open(tool.url, '_blank');
    }
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-card bg-gradient-card border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-medium line-clamp-2">{tool.name}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {tool.notes && (
          <p className="text-sm text-muted-foreground line-clamp-2">{tool.notes}</p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">{tool.category}</Badge>
            {tool.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          {tool.url && (
            <Button onClick={handleOpenLink} variant="outline" size="sm">
              <ExternalLink className="h-3 w-3 mr-1" />
              Open
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}