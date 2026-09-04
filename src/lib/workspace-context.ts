import { dbHelpers } from "@/lib/database";
import { workflowHelpers } from "@/lib/workflows";

/**
 * A compact inventory of the user's workspace that gets handed to the model so
 * PVault AI can plan real work with the prompts, tools and flows they own.
 */
export async function buildWorkspaceContext(projectId?: string | null): Promise<string> {
  const [projects, prompts, tools, flows] = await Promise.all([
    dbHelpers.getAllProjects(),
    dbHelpers.getAllPrompts(),
    dbHelpers.getAllTools(),
    workflowHelpers.getAllWorkflows(),
  ]);

  const scope = <T extends { projectId: string }>(items: T[]) =>
    projectId ? items.filter((i) => i.projectId === projectId) : items;

  const name = (id: string) => projects.find((p) => p.id === id)?.name ?? "No project";
  const cap = <T,>(items: T[], n = 60) => items.slice(0, n);

  const lines: string[] = [];

  if (projectId) {
    const current = projects.find((p) => p.id === projectId);
    if (current) lines.push(`Current project: ${current.name}${current.description ? ` - ${current.description}` : ""}`);
  } else if (projects.length) {
    lines.push(`Projects: ${cap(projects, 30).map((p) => p.name).join(", ")}`);
  }

  const ps = scope(prompts);
  if (ps.length) {
    lines.push(
      "Saved prompts:\n" +
        cap(ps)
          .map((p) => `- ${p.title || "Untitled"} [${p.category || "general"}] (${name(p.projectId)})`)
          .join("\n"),
    );
  }

  const ts = scope(tools);
  if (ts.length) {
    lines.push(
      "Saved tools:\n" +
        cap(ts)
          .map((t) => `- ${t.name}${t.url ? ` (${t.url})` : ""} [${t.category || "tool"}]${t.notes ? ` - ${t.notes.slice(0, 90)}` : ""}`)
          .join("\n"),
    );
  }

  const fs = scope(flows);
  if (fs.length) {
    lines.push(
      "Saved flows:\n" +
        cap(fs)
          .map((f) => `- ${f.name} (${f.steps.length} steps: ${f.steps.map((s) => s.label).join(" -> ")})`)
          .join("\n"),
    );
  }

  if (!lines.length) return "The workspace is empty so far: no projects, prompts, tools or flows saved yet.";
  return lines.join("\n\n");
}
