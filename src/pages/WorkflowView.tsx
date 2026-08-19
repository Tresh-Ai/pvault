import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { dbHelpers, Prompt, Tool } from "@/lib/database";
import { Workflow, WorkflowStep, workflowHelpers } from "@/lib/workflows";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowDown,
  Check,
  Copy,
  ExternalLink,
  FileText,
  Wrench,
  StickyNote,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Play,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function WorkflowView() {
  const { projectId, workflowId } = useParams<{ projectId: string; workflowId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [mode, setMode] = useState<"run" | "edit">("run");
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [meta, setMeta] = useState({ name: "", description: "" });

  useEffect(() => {
    (async () => {
      if (!projectId || !workflowId) return;
      const [wf, p, t] = await Promise.all([
        workflowHelpers.getWorkflow(workflowId),
        dbHelpers.getProjectPrompts(projectId),
        dbHelpers.getProjectTools(projectId),
      ]);
      if (!wf) {
        navigate(`/project/${projectId}`);
        return;
      }
      setWorkflow(wf);
      setMeta({ name: wf.name, description: wf.description || "" });
      setPrompts(p);
      setTools(t);
      if (wf.steps.length === 0) setMode("edit");
    })();
  }, [projectId, workflowId, navigate]);

  const promptMap = useMemo(() => new Map(prompts.map((p) => [p.id, p])), [prompts]);
  const toolMap = useMemo(() => new Map(tools.map((t) => [t.id, t])), [tools]);

  const persist = async (steps: WorkflowStep[], extra?: Partial<Workflow>) => {
    if (!workflow) return;
    setWorkflow({ ...workflow, ...extra, steps });
    await workflowHelpers.updateWorkflow(workflow.id, { steps, ...extra });
  };

  const addStep = async (step: WorkflowStep) => {
    if (!workflow) return;
    await persist([...workflow.steps, step]);
    setAddOpen(false);
    setNoteText("");
  };

  const removeStep = async (id: string) => {
    if (!workflow) return;
    await persist(workflow.steps.filter((s) => s.id !== id));
  };

  const moveStep = async (index: number, dir: -1 | 1) => {
    if (!workflow) return;
    const next = [...workflow.steps];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    await persist(next);
  };

  const saveMeta = async () => {
    if (!workflow || !meta.name.trim()) return;
    await persist(workflow.steps, {
      name: meta.name.trim(),
      description: meta.description.trim() || undefined,
    });
    toast({ title: "Workflow saved" });
  };

  const copyStep = async (step: WorkflowStep) => {
    const prompt = step.kind === "prompt" && step.refId ? promptMap.get(step.refId) : undefined;
    const text = prompt?.content ?? step.note ?? step.label;
    try {
      await navigator.clipboard.writeText(text);
      if (prompt) await dbHelpers.incrementPromptUsage(prompt.id);
      setDone((d) => ({ ...d, [step.id]: true }));
      toast({ title: "Copied", description: "Paste it into your AI tool." });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const openTool = async (step: WorkflowStep) => {
    const tool = step.refId ? toolMap.get(step.refId) : undefined;
    if (tool?.url) {
      await dbHelpers.incrementToolUsage(tool.id);
      window.open(tool.url, "_blank");
    }
    setDone((d) => ({ ...d, [step.id]: true }));
  };

  const completeRun = async () => {
    if (!workflow) return;
    await workflowHelpers.markRun(workflow.id);
    setWorkflow({ ...workflow, runCount: workflow.runCount + 1 });
    setDone({});
    toast({ title: "Workflow complete", description: "Nice work." });
  };

  if (!workflow) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const stepIcon = (kind: WorkflowStep["kind"]) =>
    kind === "prompt" ? FileText : kind === "tool" ? Wrench : StickyNote;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center gap-2">
          <button
            onClick={() => navigate(`/project/${projectId}`)}
            aria-label="Back to project"
            className="shrink-0 h-8 w-8 -ml-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-base font-semibold tracking-tight truncate flex-1">
            {workflow.name}
          </h1>
          <div className="flex bg-secondary rounded-full p-0.5 shrink-0">
            <button
              onClick={() => setMode("run")}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1",
                mode === "run" ? "bg-background shadow-card" : "text-muted-foreground",
              )}
            >
              <Play className="h-3 w-3" /> Run
            </button>
            <button
              onClick={() => setMode("edit")}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1",
                mode === "edit" ? "bg-background shadow-card" : "text-muted-foreground",
              )}
            >
              <Pencil className="h-3 w-3" /> Edit
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 pb-28">
        {mode === "edit" && (
          <div className="space-y-3 mb-6 rounded-2xl border border-border bg-card p-4">
            <div>
              <Label htmlFor="wf-name">Name</Label>
              <Input
                id="wf-name"
                value={meta.name}
                onChange={(e) => setMeta((m) => ({ ...m, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="wf-desc">Description</Label>
              <Textarea
                id="wf-desc"
                rows={2}
                value={meta.description}
                onChange={(e) => setMeta((m) => ({ ...m, description: e.target.value }))}
                placeholder="What does this workflow accomplish?"
              />
            </div>
            <Button onClick={saveMeta} size="sm" className="rounded-full">
              Save details
            </Button>
          </div>
        )}

        {workflow.description && mode === "run" && (
          <p className="text-sm text-muted-foreground mb-5">{workflow.description}</p>
        )}

        {workflow.steps.length === 0 ? (
          <div className="text-center py-16 max-w-sm mx-auto">
            <div className="w-14 h-14 mx-auto bg-secondary border border-border rounded-2xl flex items-center justify-center mb-5">
              <Plus className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-semibold mb-2">No steps yet</h2>
            <p className="text-sm text-muted-foreground">
              Chain prompts and tools into a repeatable sequence.
            </p>
          </div>
        ) : (
          <ol className="space-y-3">
            {workflow.steps.map((step, i) => {
              const Icon = stepIcon(step.kind);
              const prompt = step.refId ? promptMap.get(step.refId) : undefined;
              const tool = step.refId ? toolMap.get(step.refId) : undefined;
              const isDone = !!done[step.id];

              return (
                <li key={step.id}>
                  <div
                    className={cn(
                      "rounded-2xl border bg-card p-4 transition-colors",
                      isDone ? "border-primary/50" : "border-border",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 shrink-0 rounded-xl border flex items-center justify-center text-xs font-semibold",
                          isDone
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary border-border",
                        )}
                      >
                        {isDone ? <Check className="h-4 w-4" /> : i + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            {step.kind}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold tracking-tight line-clamp-2">
                          {step.kind === "prompt"
                            ? prompt?.title ?? step.label
                            : step.kind === "tool"
                              ? tool?.name ?? step.label
                              : step.label}
                        </h3>
                        {step.kind === "note" && step.note && (
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                            {step.note}
                          </p>
                        )}
                        {step.kind === "prompt" && prompt && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {prompt.content}
                          </p>
                        )}
                        {step.kind === "tool" && tool?.url && (
                          <p className="text-xs text-muted-foreground truncate mt-1">{tool.url}</p>
                        )}
                        {(step.kind === "prompt" && !prompt) ||
                        (step.kind === "tool" && !tool) ? (
                          <Badge variant="secondary" className="mt-2 text-[10px] rounded-full">
                            Item no longer exists
                          </Badge>
                        ) : null}

                        <div className="flex gap-1 mt-3">
                          {mode === "run" ? (
                            <>
                              {step.kind === "tool" ? (
                                <Button
                                  onClick={() => openTool(step)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 rounded-full px-3 text-xs"
                                >
                                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => copyStep(step)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 rounded-full px-3 text-xs"
                                >
                                  <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                                </Button>
                              )}
                              <Button
                                onClick={() => setDone((d) => ({ ...d, [step.id]: !d[step.id] }))}
                                variant="ghost"
                                size="sm"
                                className="h-8 rounded-full px-3 text-xs text-muted-foreground"
                              >
                                {isDone ? "Undo" : "Mark done"}
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                onClick={() => moveStep(i, -1)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground"
                                aria-label="Move up"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => moveStep(i, 1)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground"
                                aria-label="Move down"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => removeStep(step.id)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive"
                                aria-label="Remove step"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {i < workflow.steps.length - 1 && (
                    <div className="flex justify-center py-1">
                      <ArrowDown className="h-4 w-4 text-border" />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}

        <div className="flex gap-2 mt-6">
          <Button onClick={() => setAddOpen(true)} variant="outline" className="flex-1 rounded-full">
            <Plus className="h-4 w-4 mr-1.5" /> Add step
          </Button>
          {mode === "run" && workflow.steps.length > 0 && (
            <Button onClick={completeRun} className="flex-1 rounded-full">
              <Check className="h-4 w-4 mr-1.5" /> Finish run
            </Button>
          )}
        </div>
      </main>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="w-[90vw] max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add a step</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Prompts
              </h4>
              {prompts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No prompts in this project yet.</p>
              ) : (
                <div className="space-y-1">
                  {prompts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addStep(workflowHelpers.newStep("prompt", p.title, p.id))}
                      className="w-full text-left rounded-xl px-3 py-2 text-sm hover:bg-secondary transition-colors flex items-center gap-2"
                    >
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{p.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Tools
              </h4>
              {tools.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tools in this project yet.</p>
              ) : (
                <div className="space-y-1">
                  {tools.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => addStep(workflowHelpers.newStep("tool", t.name, t.id))}
                      className="w-full text-left rounded-xl px-3 py-2 text-sm hover:bg-secondary transition-colors flex items-center gap-2"
                    >
                      <Wrench className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{t.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Note</h4>
              <Textarea
                rows={2}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="A manual step or reminder"
              />
              <Button
                onClick={() => {
                  const text = noteText.trim();
                  if (!text) return;
                  const step = workflowHelpers.newStep("note", text.split("\n")[0].slice(0, 60));
                  step.note = text;
                  addStep(step);
                }}
                size="sm"
                className="mt-2 rounded-full"
              >
                Add note step
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
