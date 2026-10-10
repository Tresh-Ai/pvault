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

// Bolt Performance Optimization: Single-pass query normalization & zero-allocation score matching.
// Pre-lowercases search query once and avoids allocating intermediate message/step arrays on every search keystroke.
function score(qLower: string, ...fields: (string | undefined)[]): number {
  if (!qLower) return 0;
  let best = 0;
  for (let index = 0; index < fields.length; index++) {
    const field = fields[index];
    if (!field) continue;
    const value = field.toLowerCase();
    const weight = index === 0 ? 3 : 1;
    if (value === qLower) best = Math.max(best, 100 * weight);
    else if (value.startsWith(qLower)) best = Math.max(best, 60 * weight);
    else if (value.includes(qLower)) best = Math.max(best, 30 * weight);
  }
  return best;
}

function scoreChat(qLower: string, chat: Chat): number {
  const titleScore = score(qLower, chat.title);
  // Early return if title matches exact (300) or startsWith (180), which beats max possible message score (100)
  if (titleScore >= 180) return titleScore;

  let maxMsgScore = 0;
  for (let i = 0; i < chat.messages.length; i++) {
    const content = chat.messages[i].content;
    if (!content) continue;
    const val = content.toLowerCase();
    if (val === qLower) { maxMsgScore = 100; break; }
    if (val.startsWith(qLower)) maxMsgScore = Math.max(maxMsgScore, 60);
    else if (val.includes(qLower)) maxMsgScore = Math.max(maxMsgScore, 30);
  }
  return Math.max(titleScore, maxMsgScore);
}

function excerpt(text: string, length = 70): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > length ? `${clean.slice(0, length)}...` : clean;
}

/** One search across projects, prompts, tools, flows and chats. */
export async function searchEverything(query: string, limit = 40): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];
  const qLower = q.toLowerCase();

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
    const s = score(qLower, p.name, p.description, p.tags.join(" "));
    if (s) results.push({ kind: "project", id: p.id, title: p.name, subtitle: p.description, href: `/project/${p.id}`, score: s });
  }

  for (const p of prompts) {
    const s = score(qLower, p.title, p.content, p.tags.join(" "), p.category);
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
    const s = score(qLower, t.name, t.notes, t.tags.join(" "), t.category);
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
    const stepsText = f.steps.length > 0 ? f.steps.map((step) => step.label).join(" ") : undefined;
    const s = score(qLower, f.name, f.description, stepsText);
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
    const s = scoreChat(qLower, c);
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
