import { dbHelpers, type Project, type Prompt, type Tool } from "./database";
import { workflowHelpers, type Workflow } from "./workflows";
import { chatHelpers, type Chat } from "./chats";

export type SearchKind = "project" | "prompt" | "tool" | "flow" | "chat";

export interface SearchResult {
  kind: SearchKind;
  id: string;
  title: string;
  subtitle?: string;
  projectId?: string;
  projectName?: string;
  /** Route to open this result. */
  href: string;
  score: number;
}

function score(query: string, ...fields: (string | undefined)[]): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  let best = 0;
  fields.forEach((field, index) => {
    if (!field) return;
    const value = field.toLowerCase();
    const weight = index === 0 ? 3 : 1;
    if (value === q) best = Math.max(best, 100 * weight);
    else if (value.startsWith(q)) best = Math.max(best, 60 * weight);
    else if (value.includes(q)) best = Math.max(best, 30 * weight);
  });
  return best;
}

function excerpt(text: string, length = 70): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > length ? `${clean.slice(0, length)}...` : clean;
}

/** One search across projects, prompts, tools, flows and chats. */
export async function searchEverything(query: string, limit = 40): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const projects: Project[] = await dbHelpers.getAllProjects();
  const projectName = new Map(projects.map((p) => [p.id, p.name]));

  const prompts: Prompt[] = [];
  const tools: Tool[] = [];
  const flows: Workflow[] = [];
  for (const project of projects) {
    prompts.push(...(await dbHelpers.getProjectPrompts(project.id)));
    tools.push(...(await dbHelpers.getProjectTools(project.id)));
    flows.push(...(await workflowHelpers.getProjectWorkflows(project.id)));
  }
  const chats: Chat[] = await chatHelpers.getAllChats();

  const results: SearchResult[] = [];

  for (const p of projects) {
    const s = score(q, p.name, p.description, p.tags.join(" "));
    if (s) results.push({ kind: "project", id: p.id, title: p.name, subtitle: p.description, href: `/project/${p.id}`, score: s });
  }

  for (const p of prompts) {
    const s = score(q, p.title, p.content, p.tags.join(" "), p.category);
    if (s)
      results.push({
        kind: "prompt",
        id: p.id,
        title: p.title || "Untitled prompt",
        subtitle: excerpt(p.content),
        projectId: p.projectId,
        projectName: projectName.get(p.projectId),
        href: `/project/${p.projectId}/prompt/edit?promptId=${p.id}`,
        score: s,
      });
  }

  for (const t of tools) {
    const s = score(q, t.name, t.notes, t.tags.join(" "), t.category);
    if (s)
      results.push({
        kind: "tool",
        id: t.id,
        title: t.name,
        subtitle: t.url || t.notes,
        projectId: t.projectId,
        projectName: projectName.get(t.projectId),
        href: `/project/${t.projectId}?tab=tools&highlight=${t.id}`,
        score: s,
      });
  }

  for (const f of flows) {
    const s = score(q, f.name, f.description, f.steps.map((step) => step.label).join(" "));
    if (s)
      results.push({
        kind: "flow",
        id: f.id,
        title: f.name,
        subtitle: `${f.steps.length} ${f.steps.length === 1 ? "step" : "steps"}`,
        projectId: f.projectId,
        projectName: projectName.get(f.projectId),
        href: `/project/${f.projectId}/workflow/${f.id}`,
        score: s,
      });
  }

  for (const c of chats) {
    const s = score(q, c.title, c.messages.map((m) => m.content).join(" "));
    if (s)
      results.push({
        kind: "chat",
        id: c.id,
        title: c.title,
        subtitle: `${c.messages.length} ${c.messages.length === 1 ? "message" : "messages"}`,
        projectId: c.projectId,
        projectName: projectName.get(c.projectId),
        href: `/project/${c.projectId}/chat/${c.id}`,
        score: s,
      });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

export interface UsageStats {
  totals: { projects: number; prompts: number; tools: number; flows: number; chats: number };
  mostUsed: Prompt[];
  recentlyUsed: Prompt[];
  favorites: Prompt[];
  topTags: { tag: string; count: number }[];
  projectNames: Record<string, string>;
}

/** Local-only analytics. Nothing leaves the device. */
export async function getUsageStats(): Promise<UsageStats> {
  const projects = await dbHelpers.getAllProjects();
  const prompts: Prompt[] = [];
  const tools: Tool[] = [];
  const flows: Workflow[] = [];
  for (const project of projects) {
    prompts.push(...(await dbHelpers.getProjectPrompts(project.id)));
    tools.push(...(await dbHelpers.getProjectTools(project.id)));
    flows.push(...(await workflowHelpers.getProjectWorkflows(project.id)));
  }
  const chats = await chatHelpers.getAllChats();

  const tagCounts = new Map<string, number>();
  prompts.forEach((p) => p.tags.forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)));

  return {
    totals: {
      projects: projects.length,
      prompts: prompts.length,
      tools: tools.length,
      flows: flows.length,
      chats: chats.length,
    },
    mostUsed: [...prompts].filter((p) => (p.usageCount || 0) > 0).sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0)).slice(0, 8),
    recentlyUsed: [...prompts]
      .filter((p) => p.lastUsedAt)
      .sort((a, b) => new Date(b.lastUsedAt!).getTime() - new Date(a.lastUsedAt!).getTime())
      .slice(0, 8),
    favorites: prompts.filter((p) => p.isFavorite).slice(0, 12),
    topTags: [...tagCounts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12),
    projectNames: Object.fromEntries(projects.map((p) => [p.id, p.name])),
  };
}
