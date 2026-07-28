import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tool } from "@/lib/database";
import { ExternalLink, MoreVertical, Wrench } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ToolCardProps {
  tool: Tool;
  onEdit: () => void;
  onDelete: () => void;
  onIncrementUsage: () => void;
}

export function ToolCard({ tool, onEdit, onDelete, onIncrementUsage }: ToolCardProps) {
  const handleOpenLink = () => {
    if (tool.url) {
      onIncrementUsage();
      window.open(tool.url, '_blank');
    }
  };

  return (
    <div className="group rounded-2xl border border-border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-card">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-secondary border border-border flex items-center justify-center">
          <Wrench className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-base font-semibold tracking-tight line-clamp-1">{tool.name}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 -mr-1 -mt-1">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {tool.notes && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{tool.notes}</p>
          )}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 flex-wrap min-w-0">
              <Badge variant="secondary" className="text-[10px] rounded-full px-2 py-0">{tool.category}</Badge>
              {tool.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-[10px] rounded-full px-2 py-0">{tag}</Badge>
              ))}
            </div>
            {tool.url && (
              <Button onClick={handleOpenLink} variant="ghost" size="sm" className="h-8 rounded-full px-3 text-xs shrink-0">
                Open
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
