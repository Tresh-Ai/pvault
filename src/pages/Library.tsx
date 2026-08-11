import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileText, GitBranch, Wrench } from "lucide-react";
import { dbHelpers, type Project, type Prompt, type Tool } from "@/lib/database";
import { workflowHelpers, type Workflow as Flow } from "@/lib/workflows";
import { SearchInput } from "@/components/ui/search-input";

type Kind = "prompts" | "tools" | "flows";

const META: Record<Kind, { title: string; blurb: string; icon: typeof FileText }> = {
  prompts: { title: "Prompts", blurb: "Everything you have written, most recently used first.", icon: FileText },
  tools: { title: "Tools", blurb: "The AI tools you keep coming back to.", icon: Wrench },
  flows: { title: "Flows", blurb: "Chained steps you can run again in one go.", icon: GitBranch },
};

const recency = (d?: Date | string) => (d ? new Date(d).getTime() : 0);

/** Recently used view across every project, opened from the sidebar sets. */
export default function Library() {
  const { kind = "prompts" } = useParams<{ kind: Kind }>();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
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
  }, []);

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "No project";
  const active = (kind in META ? kind : "prompts") as Kind;
  const { title, blurb, icon: Icon } = META[active];

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (text: string) => !q || text.toLowerCase().includes(q);

    if (active === "prompts") {
      return prompts
        .filter((p) => match(`${p.title} ${p.content} ${p.tags.join(" ")}`))
        .sort((a, b) => (recency(b.lastUsedAt) || recency(b.updatedAt)) - (recency(a.lastUsedAt) || recency(a.updatedAt)))
        .map((p) => ({
          id: p.id,
          title: p.title || "Untitled prompt",
          subtitle: p.content.slice(0, 120),
          meta: projectName(p.projectId),
          href: `/project/${p.projectId}/prompt/edit?promptId=${p.id}`,
        }));
    }
    if (active === "tools") {
      return tools
        .filter((t) => match(`${t.name} ${t.notes ?? ""} ${t.tags.join(" ")}`))
        .sort((a, b) => (recency(b.lastUsedAt) || recency(b.updatedAt)) - (recency(a.lastUsedAt) || recency(a.updatedAt)))
        .map((t) => ({
          id: t.id,
          title: t.name,
          subtitle: t.notes || t.url || t.category,
          meta: projectName(t.projectId),
          href: `/project/${t.projectId}?tab=tools`,
        }));
    }
    return flows
      .filter((f) => match(`${f.name} ${f.description ?? ""}`))
      .sort((a, b) => (recency(b.lastRunAt) || recency(b.updatedAt)) - (recency(a.lastRunAt) || recency(a.updatedAt)))
      .map((f) => ({
        id: f.id,
        title: f.name,
        subtitle: f.description || `${f.steps.length} step${f.steps.length === 1 ? "" : "s"}`,
        meta: projectName(f.projectId),
        href: `/project/${f.projectId}/workflow/${f.id}`,
      }));
  }, [active, prompts, tools, flows, projects, query]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20">
      <div className="flex items-center gap-2.5 mb-1">
        <Icon className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-5">{blurb}</p>

      <SearchInput value={query} onChange={setQuery} placeholder={`Search ${title.toLowerCase()}...`} className="mb-4" />

      {rows.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Nothing here yet. Open a project to add your first {title.toLowerCase().slice(0, -1)}.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <button
              key={row.id}
              onClick={() => navigate(row.href)}
              className="w-full text-left rounded-lg border border-border bg-card px-4 py-3 hover:bg-secondary/60 transition-colors"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium truncate">{row.title}</p>
                <span className="shrink-0 text-[11px] text-muted-foreground truncate max-w-[40%]">{row.meta}</span>
              </div>
              {row.subtitle && (
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 whitespace-pre-wrap">{row.subtitle}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
