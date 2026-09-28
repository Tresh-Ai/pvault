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

/**
 * Bolt Performance Optimization:
 * Score a single pre-normalized field against a pre-normalized query `q`.
 * Avoids repeated `trim()`, `toLowerCase()`, spread parameter array allocations,
 * and callback function closures on every keystroke.
 */
function scoreField(q: string, field: string | undefined, weight: number): number {
  if (!field) return 0;
  const value = field.toLowerCase();
  if (value === q) return 100 * weight;
  if (value.startsWith(q)) return 60 * weight;
  if (value.includes(q)) return 30 * weight;
  return 0;
}

function excerpt(text: string, length = 70): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > length ? `${clean.slice(0, length)}...` : clean;
}

/** One search across projects, prompts, tools, flows and chats. */
export async function searchEverything(query: string, limit = 40): Promise<SearchResult[]> {
  // Normalize query once per search invocation
  const q = query.trim().toLowerCase();
  if (!q) return [];

  // Bolt Performance Optimization: Fetch all collections in parallel using single-pass helpers.
  // Replaces O(N) sequential project loop that caused 3N+2 redundant LocalStorage reads & JSON parses.
  const [projects, prompts, tools, flows, chats] = await Promise.all([
    dbHelpers.getAllProjects(),
    dbHelpers.getAllPrompts(),
    dbHelpers.getAllTools(),
    workflowHelpers.getAllWorkflows(),
    chatHelpers.getAllChats(),
  ]);

  const projectName = new Map(projects.map((p) => [p.id, p.name]));

  const results: SearchResult[] = [];

  for (const p of projects) {
    const s = Math.max(
      scoreField(q, p.name, 3),
      scoreField(q, p.description, 1),
      scoreField(q, p.tags.join(" "), 1)
    );
    if (s) results.push({ kind: "project", id: p.id, title: p.name, subtitle: p.description, href: `/project/${p.id}`, score: s });
  }

  for (const p of prompts) {
    const s = Math.max(
      scoreField(q, p.title, 3),
      scoreField(q, p.content, 1),
      scoreField(q, p.tags.join(" "), 1),
      scoreField(q, p.category, 1)
    );
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
    const s = Math.max(
      scoreField(q, t.name, 3),
      scoreField(q, t.notes, 1),
      scoreField(q, t.tags.join(" "), 1),
      scoreField(q, t.category, 1)
    );
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
    // Bolt Performance Optimization: Evaluate title & description first, then iterate steps directly
    // to avoid allocating new arrays and joining large strings (`f.steps.map(...).join(" ")`).
    let s = Math.max(scoreField(q, f.name, 3), scoreField(q, f.description, 1));
    if (s < 100) {
      for (const step of f.steps) {
        const stepScore = scoreField(q, step.label, 1);
        if (stepScore > s) {
          s = stepScore;
          if (s === 100) break;
        }
      }
    }
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
    // Bolt Performance Optimization: Evaluate title first, then iterate messages directly
    // to avoid allocating arrays and joining massive chat histories (`c.messages.map(...).join(" ")`).
    let s = scoreField(q, c.title, 3);
    if (s < 100) {
      for (const m of c.messages) {
        const msgScore = scoreField(q, m.content, 1);
        if (msgScore > s) {
          s = msgScore;
          if (s === 100) break;
        }
      }
    }
    if (s)
      results.push({
        kind: "chat",
        id: c.id,
        title: c.title,
        subtitle: `${c.messages.length} ${c.messages.length === 1 ? "message" : "messages"}`,
        projectId: c.projectId || undefined,
        projectName: c.projectId ? projectName.get(c.projectId) : undefined,
        href: c.projectId ? `/project/${c.projectId}/chat/${c.id}` : `/c/${c.id}`,
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
  // Bolt Performance Optimization: Fetch all collections concurrently in parallel.
  const [projects, prompts, tools, flows, chats] = await Promise.all([
    dbHelpers.getAllProjects(),
    dbHelpers.getAllPrompts(),
    dbHelpers.getAllTools(),
    workflowHelpers.getAllWorkflows(),
    chatHelpers.getAllChats(),
  ]);

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
