import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileText, GitBranch, Wrench } from "lucide-react";
import { dbHelpers, type Project, type Prompt, type Tool } from "@/lib/database";
import { workflowHelpers, type Workflow as Flow } from "@/lib/workflows";
import { PromptCard } from "@/components/prompt-card";
import { ToolCard } from "@/components/tool-card";
import { WorkflowCard } from "@/components/workflow-card";
import { useToast } from "@/hooks/use-toast";
import { PageHint } from "@/components/page-hint";

type Kind = "prompts" | "tools" | "flows";

const META: Record<Kind, { title: string; icon: typeof FileText }> = {
  prompts: { title: "Prompts", icon: FileText },
  tools: { title: "Tools", icon: Wrench },
  flows: { title: "Flows", icon: GitBranch },
};

const HINTS: Record<Kind, string> = {
  prompts: "Every prompt you save, across all projects. Tap one to edit it, or use the + button to add a new one and pick where it lives.",
  tools: "The AI tools you keep coming back to. Tap a card to open the link, and the + button adds another.",
  flows: "A flow chains prompts, tools and notes into steps you can replay. Tap one to run it step by step.",
};

const recency = (d?: Date | string) => (d ? new Date(d).getTime() : 0);

/** Everything of one kind across every project, using the same cards as a project. */
export default function Library() {
  const { kind = "prompts" } = useParams<{ kind: Kind }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);

  const load = () => {
    Promise.all([
      dbHelpers.getAllProjects(),
      dbHelpers.getAllPrompts(),
      dbHelpers.getAllTools(),
      workflowHelpers.getAllWorkflows(),
    ]).then(([p, pr, t, f]) => {
      setProjects(p);
      setPrompts(pr);
      setTools(t);
      setFlows(f);
    });
  };

  useEffect(load, []);

  const active = (kind in META ? kind : "prompts") as Kind;
  const { title, icon: Icon } = META[active];

  const sortedPrompts = useMemo(
    () =>
      [...prompts].sort(
        (a, b) => (recency(b.lastUsedAt) || recency(b.updatedAt)) - (recency(a.lastUsedAt) || recency(a.updatedAt)),
      ),
    [prompts],
  );
  const sortedTools = useMemo(
    () =>
      [...tools].sort(
        (a, b) => (recency(b.lastUsedAt) || recency(b.updatedAt)) - (recency(a.lastUsedAt) || recency(a.updatedAt)),
      ),
    [tools],
  );
  const sortedFlows = useMemo(
    () =>
      [...flows].sort(
        (a, b) => (recency(b.lastRunAt) || recency(b.updatedAt)) - (recency(a.lastRunAt) || recency(a.updatedAt)),
      ),
    [flows],
  );

  const count = active === "prompts" ? sortedPrompts.length : active === "tools" ? sortedTools.length : sortedFlows.length;

  const deletePrompt = async (p: Prompt) => {
    await dbHelpers.deletePrompt(p.id);
    setPrompts((prev) => prev.filter((x) => x.id !== p.id));
    toast({ title: "Prompt deleted" });
  };

  const deleteTool = async (t: Tool) => {
    await dbHelpers.deleteTool(t.id);
    setTools((prev) => prev.filter((x) => x.id !== t.id));
    toast({ title: "Tool deleted" });
  };

  const deleteFlow = async (f: Flow) => {
    await workflowHelpers.deleteWorkflow(f.id);
    setFlows((prev) => prev.filter((x) => x.id !== f.id));
    toast({ title: "Flow deleted" });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-28">
      <PageHint id={`library-${kind}`}>{HINTS[kind]}</PageHint>

      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon className="h-4 w-4" /> {title}
        </span>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>

      {count === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Nothing here yet. Tap + to add your first {title.toLowerCase().slice(0, -1)}.
        </p>
      ) : (
        <div className="space-y-3">
          {active === "prompts" &&
            sortedPrompts.map((p) => (
              <PromptCard
                key={p.id}
                prompt={p}
                onEdit={() => navigate(`/project/${p.projectId}/prompt/edit?promptId=${p.id}`)}
                onDelete={() => deletePrompt(p)}
                onToggleFavorite={() => dbHelpers.togglePromptFavorite(p.id).then(load)}
                onIncrementUsage={() => dbHelpers.incrementPromptUsage(p.id).then(load)}
              />
            ))}

          {active === "tools" &&
            sortedTools.map((t) => (
              <ToolCard
                key={t.id}
                tool={t}
                onEdit={() => navigate(`/project/${t.projectId}?tab=tools`)}
                onDelete={() => deleteTool(t)}
                onIncrementUsage={() => dbHelpers.incrementToolUsage(t.id).then(load)}
              />
            ))}

          {active === "flows" &&
            sortedFlows.map((f) => (
              <WorkflowCard
                key={f.id}
                workflow={f}
                onOpen={() => navigate(`/project/${f.projectId}/workflow/${f.id}`)}
                onEdit={() => navigate(`/project/${f.projectId}/workflow/${f.id}`)}
                onDelete={() => deleteFlow(f)}
              />
            ))}
        </div>
      )}

      {projects.length === 0 && count === 0 && (
        <p className="mt-2 text-center text-xs text-muted-foreground">Create a project first.</p>
      )}
    </div>
  );
}
