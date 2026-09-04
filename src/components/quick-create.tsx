import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dbHelpers, type Project } from "@/lib/database";
import { workflowHelpers } from "@/lib/workflows";
import { useToast } from "@/hooks/use-toast";

export type QuickKind = "project" | "prompt" | "tool" | "flow";

const TITLES: Record<QuickKind, string> = {
  project: "New project",
  prompt: "New prompt",
  tool: "New tool",
  flow: "New flow",
};

interface QuickCreateProps {
  kind: QuickKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** One dialog for creating anything, with a project picker when needed. */
export function QuickCreate({ kind, open, onOpenChange }: QuickCreateProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setNotes("");
    setUrl("");
    dbHelpers.getAllProjects().then((list) => {
      setProjects(list);
      setProjectId((prev) => prev || list[0]?.id || "");
    });
  }, [open, kind]);

  const needsProject = kind !== "project";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (needsProject && !projectId) {
      toast({ title: "Create a project first", description: "Everything lives inside a project." });
      return;
    }
    setBusy(true);
    try {
      if (kind === "project") {
        const project = await dbHelpers.createProject({
          name: name.trim(),
          description: notes.trim() || undefined,
          tags: [],
        });
        onOpenChange(false);
        navigate(`/project/${project.id}`);
        return;
      }
      if (kind === "prompt") {
        const prompt = await dbHelpers.createPrompt({
          projectId,
          title: name.trim(),
          content: "",
          tags: [],
          category: "Other",
          format: "text",
          isFavorite: false,
        });
        onOpenChange(false);
        navigate(`/project/${projectId}/prompt/edit?promptId=${prompt.id}`);
        return;
      }
      if (kind === "tool") {
        await dbHelpers.createTool({
          projectId,
          name: name.trim(),
          url: url.trim(),
          category: "Other",
          notes: notes.trim() || undefined,
          tags: [],
        });
        onOpenChange(false);
        navigate(`/project/${projectId}?tab=tools`);
        return;
      }
      const flow = await workflowHelpers.createWorkflow({
        projectId,
        name: name.trim(),
        description: notes.trim() || undefined,
      });
      onOpenChange(false);
      navigate(`/project/${projectId}/workflow/${flow.id}`);
    } catch {
      toast({ title: "Could not create that", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle>{TITLES[kind]}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {needsProject && (
            <div>
              <Label>Project</Label>
              {projects.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  No projects yet. Create a project first.
                </p>
              ) : (
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="qc-name">{kind === "tool" ? "Tool name" : "Name"}</Label>
            <Input
              id="qc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                kind === "project" ? "Client website" : kind === "prompt" ? "Untitled prompt" : kind === "tool" ? "Midjourney" : "Weekly report flow"
              }
              autoFocus
              required
            />
          </div>

          {kind === "tool" && (
            <div>
              <Label htmlFor="qc-url">Link (optional)</Label>
              <Input id="qc-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
            </div>
          )}

          {kind !== "prompt" && (
            <div>
              <Label htmlFor="qc-notes">Notes (optional)</Label>
              <Textarea id="qc-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1 rounded-full" disabled={busy}>
              Create
            </Button>
            <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
