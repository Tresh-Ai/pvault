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
 * Fast single-field scoring using a pre-normalized query string `q`.
 */
function scoreField(q: string, text: string | undefined, weight: number): number {
  if (!text) return 0;
  const value = text.toLowerCase();
  if (value === q) return 100 * weight;
  if (value.startsWith(q)) return 60 * weight;
  if (value.includes(q)) return 30 * weight;
  return 0;
}

/**
 * Bolt Performance Optimization:
 * Lazy score calculation with short-circuiting.
 * Normalizes query string once per search call rather than per field comparison.
 * Eliminates array mappings and string concatenations (`tags.join()`).
 */
function scoreItem(
  q: string,
  primary: string | undefined,
  secondaryFields?: (string | undefined)[],
  secondaryArrays?: (string[] | undefined)[],
): number {
  const primaryScore = scoreField(q, primary, 3);
  // Short-circuit: if primary score is exact match (300) or startsWith (180),
  // secondary fields (max weight-1 score 100) cannot beat or alter primaryScore.
  if (primaryScore >= 180) return primaryScore;

  let best = primaryScore;

  if (secondaryFields) {
    for (let i = 0; i < secondaryFields.length; i++) {
      const s = scoreField(q, secondaryFields[i], 1);
      if (s > best) {
        best = s;
        if (best >= 100) return best;
      }
    }
  }

  if (secondaryArrays) {
    for (let i = 0; i < secondaryArrays.length; i++) {
      const arr = secondaryArrays[i];
      if (!arr) continue;
      for (let j = 0; j < arr.length; j++) {
        const s = scoreField(q, arr[j], 1);
        if (s > best) {
          best = s;
          if (best >= 100) return best;
        }
      }
    }
  }

  return best;
}

function scoreChat(q: string, chat: Chat): number {
  const primaryScore = scoreField(q, chat.title, 3);
  if (primaryScore >= 180) return primaryScore;

  let best = primaryScore;
  const messages = chat.messages;
  for (let i = 0; i < messages.length; i++) {
    const s = scoreField(q, messages[i].content, 1);
    if (s > best) {
      best = s;
      if (best >= 100) break;
    }
  }
  return best;
}

function scoreFlow(q: string, flow: Workflow): number {
  const primaryScore = scoreField(q, flow.name, 3);
  if (primaryScore >= 180) return primaryScore;

  let best = primaryScore;
  const descScore = scoreField(q, flow.description, 1);
  if (descScore > best) {
    best = descScore;
    if (best >= 100) return best;
  }

  const steps = flow.steps;
  for (let i = 0; i < steps.length; i++) {
    const s = scoreField(q, steps[i].label, 1);
    if (s > best) {
      best = s;
      if (best >= 100) break;
    }
  }
  return best;
}

function excerpt(text: string, length = 70): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > length ? `${clean.slice(0, length)}...` : clean;
}

/** One search across projects, prompts, tools, flows and chats. */
export async function searchEverything(query: string, limit = 40): Promise<SearchResult[]> {
  const qNorm = query.trim().toLowerCase();
  if (!qNorm) return [];

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
    const s = scoreItem(qNorm, p.name, [p.description], [p.tags]);
    if (s) results.push({ kind: "project", id: p.id, title: p.name, subtitle: p.description, href: `/project/${p.id}`, score: s });
  }

  for (const p of prompts) {
    const s = scoreItem(qNorm, p.title, [p.content, p.category], [p.tags]);
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
    const s = scoreItem(qNorm, t.name, [t.notes, t.category, t.url], [t.tags]);
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
    const s = scoreFlow(qNorm, f);
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
    const s = scoreChat(qNorm, c);
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
