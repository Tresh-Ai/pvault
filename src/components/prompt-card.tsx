import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Prompt } from "@/lib/database";
import { Copy, Star, MoreVertical, Download, Hash, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PromptCardProps {
  prompt: Prompt;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onIncrementUsage: () => void;
}

export function PromptCard({ prompt, onEdit, onDelete, onToggleFavorite, onIncrementUsage }: PromptCardProps) {
  const { toast } = useToast();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt.content);
      onIncrementUsage();
      toast({ title: "Copied", description: "Prompt copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const isJson = prompt.format === 'json';
      const isMd = prompt.format === 'markdown';
      const content = isJson
        ? JSON.stringify(JSON.parse(prompt.content), null, 2)
        : prompt.content;
      const blob = new Blob([content], {
        type: isJson ? 'application/json' : isMd ? 'text/markdown' : 'text/plain',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${prompt.title.replace(/[^a-zA-Z0-9]/g, '_')}.${isJson ? 'json' : isMd ? 'md' : 'txt'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onIncrementUsage();
      toast({ title: "Exported" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  return (
    <div
      onClick={onEdit}
      className="rounded-2xl border border-border bg-card p-4 cursor-pointer transition-all hover:border-foreground/20 hover:shadow-card"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-base font-semibold tracking-tight line-clamp-2 flex-1">{prompt.title}</h3>
        <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFavorite}
            aria-label="Toggle favorite"
            className={cn("h-8 w-8 p-0", prompt.isFavorite ? "text-primary" : "text-muted-foreground")}
          >
            <Star className={cn("h-4 w-4", prompt.isFavorite && "fill-current")} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground" aria-label="Prompt menu">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{prompt.content}</p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 flex-wrap min-w-0">
          <Badge variant="secondary" className="text-[10px] rounded-full px-2 py-0">{prompt.category}</Badge>
          {prompt.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] text-muted-foreground inline-flex items-center gap-0.5">
              <Hash className="h-2.5 w-2.5" />{tag}
            </span>
          ))}
          {prompt.usageCount > 0 && (
            <span className="text-[10px] text-muted-foreground">· used {prompt.usageCount}×</span>
          )}
        </div>
        <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button onClick={handleCopy} variant="ghost" size="sm" className="h-8 rounded-full px-3 text-xs">
            <Copy className="h-3.5 w-3.5 mr-1" />
            Copy
          </Button>
          <Button onClick={handleExport} variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Export prompt">
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
