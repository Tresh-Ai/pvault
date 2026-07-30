import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Workflow } from "@/lib/workflows";
import { MoreVertical, Play, Trash2, Pencil, GitBranch } from "lucide-react";

interface WorkflowCardProps {
  workflow: Workflow;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function WorkflowCard({ workflow, onOpen, onEdit, onDelete }: WorkflowCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-foreground/20">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-secondary border border-border flex items-center justify-center">
          <GitBranch className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <button
              onClick={onOpen}
              className="text-left text-base font-semibold tracking-tight line-clamp-1"
            >
              {workflow.name}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 -mr-1 -mt-1 text-muted-foreground"
                  aria-label="Workflow menu"
                >
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

          {workflow.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {workflow.description}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 mt-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-[10px] rounded-full px-2 py-0">
                {workflow.steps.length} {workflow.steps.length === 1 ? "step" : "steps"}
              </Badge>
              {workflow.runCount > 0 && <span>· run {workflow.runCount}×</span>}
            </div>
            <Button onClick={onOpen} variant="ghost" size="sm" className="h-8 rounded-full px-3 text-xs">
              <Play className="h-3.5 w-3.5 mr-1" /> Run
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
