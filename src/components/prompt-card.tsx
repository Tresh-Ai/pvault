import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Prompt } from "@/lib/database";
import { Copy, Heart, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface PromptCardProps {
  prompt: Prompt;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onIncrementUsage: () => void;
}

export function PromptCard({ 
  prompt, 
  onEdit, 
  onDelete, 
  onToggleFavorite, 
  onIncrementUsage 
}: PromptCardProps) {
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      onIncrementUsage();
      toast({
        title: "Copied to clipboard",
        description: "Prompt content has been copied successfully.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-card bg-gradient-card border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-medium line-clamp-2">{prompt.title}</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleFavorite}
              className={prompt.isFavorite ? "text-red-500 hover:text-red-600" : "text-muted-foreground"}
            >
              <Heart className={`h-4 w-4 ${prompt.isFavorite ? "fill-current" : ""}`} />
            </Button>
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
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3">{prompt.content}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">{prompt.category}</Badge>
            {prompt.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          <Button onClick={handleCopy} variant="outline" size="sm">
            <Copy className="h-3 w-3 mr-1" />
            Copy
          </Button>
        </div>

        <div className="text-xs text-muted-foreground flex justify-between">
          <span>Used {prompt.usageCount} times</span>
          {prompt.lastUsedAt && (
            <span>Last used {prompt.lastUsedAt.toLocaleDateString()}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}