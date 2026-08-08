/**
 * Full backup and merge-import for everything stored on the device.
 * Import never wipes existing data: matching ids are updated, new ids are added.
 */

const KEYS = {
  projects: "pvault_projects",
  prompts: "pvault_prompts",
  tools: "pvault_tools",
  workflows: "pvault_workflows",
  chats: "pvault_chats",
} as const;

type Entity = "projects" | "prompts" | "tools" | "workflows" | "chats";

interface WithId {
  id?: string;
  updatedAt?: string | Date;
  [key: string]: unknown;
}

export interface BackupFile {
  app: "pvault";
  version: string;
  exportDate: string;
  projects: WithId[];
  prompts: WithId[];
  tools: WithId[];
  workflows: WithId[];
  chats: WithId[];
}

export interface ImportSummary {
  added: Record<Entity, number>;
  updated: Record<Entity, number>;
  skipped: number;
}

function readRaw(key: string): WithId[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(key: string, items: WithId[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

export function buildBackup(): BackupFile {
  return {
    app: "pvault",
    version: "1.2",
    exportDate: new Date().toISOString(),
    projects: readRaw(KEYS.projects),
    prompts: readRaw(KEYS.prompts),
    tools: readRaw(KEYS.tools),
    workflows: readRaw(KEYS.workflows),
    chats: readRaw(KEYS.chats),
  };
}

export function downloadBackup() {
  const data = buildBackup();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pvault-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function time(value: unknown): number {
  const t = new Date(value as string).getTime();
  return Number.isFinite(t) ? t : 0;
}

/** Merge one collection: same id wins by newest updatedAt, unknown ids are appended. */
function mergeCollection(key: string, incoming: unknown): { added: number; updated: number; skipped: number } {
  if (!Array.isArray(incoming)) return { added: 0, updated: 0, skipped: 0 };

  const existing = readRaw(key);
  const index = new Map(existing.map((item, i) => [item.id, i]));
  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of incoming as WithId[]) {
    if (!item || typeof item !== "object" || typeof item.id !== "string") {
      skipped += 1;
      continue;
    }
    const at = index.get(item.id);
    if (at === undefined) {
      existing.push(item);
      index.set(item.id, existing.length - 1);
      added += 1;
    } else if (time(item.updatedAt) >= time(existing[at].updatedAt)) {
      existing[at] = { ...existing[at], ...item };
      updated += 1;
    } else {
      skipped += 1;
    }
  }

  writeRaw(key, existing);
  return { added, updated, skipped };
}

/**
 * Accepts a PVault backup, or a bare array of prompts exported from a single project.
 * `fallbackProjectId` is used when imported prompts/tools carry no project.
 */
export function importBackup(payload: unknown, fallbackProjectId?: string): ImportSummary {
  const summary: ImportSummary = {
    added: { projects: 0, prompts: 0, tools: 0, workflows: 0, chats: 0 },
    updated: { projects: 0, prompts: 0, tools: 0, workflows: 0, chats: 0 },
    skipped: 0,
  };

  let file: Partial<BackupFile>;
  if (Array.isArray(payload)) {
    file = { prompts: payload as WithId[] };
  } else if (payload && typeof payload === "object") {
    file = payload as Partial<BackupFile>;
  } else {
    throw new Error("This file is not a PVault backup.");
  }

  const known: Entity[] = ["projects", "prompts", "tools", "workflows", "chats"];
  if (!known.some((entity) => Array.isArray(file[entity]))) {
    throw new Error("No projects, prompts, tools, flows or chats found in this file.");
  }

  const normalise = (items: WithId[] | undefined) =>
    (items || []).map((item) => {
      const next = { ...item };
      if (!next.projectId && fallbackProjectId) next.projectId = fallbackProjectId;
      if (!next.updatedAt) next.updatedAt = next.createdAt || new Date().toISOString();
      return next;
    });

  for (const entity of known) {
    const result = mergeCollection(
      KEYS[entity],
      entity === "prompts" || entity === "tools" ? normalise(file[entity] as WithId[]) : file[entity],
    );
    summary.added[entity] = result.added;
    summary.updated[entity] = result.updated;
    summary.skipped += result.skipped;
  }

  return summary;
}

export async function importFromFile(file: File, fallbackProjectId?: string): Promise<ImportSummary> {
  const text = await file.text();
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("Could not read that file. PVault imports JSON backups.");
  }
  return importBackup(payload, fallbackProjectId);
}
