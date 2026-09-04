/**
 * Optional cloud backup. PVault stays local-first: everything lives in
 * localStorage, and signed-in users can additionally sync that snapshot so it
 * follows them to another device.
 */
import { supabase } from "@/integrations/supabase/client";

const LOCAL_KEYS = [
  "pvault_projects",
  "pvault_prompts",
  "pvault_tools",
  "pvault_workflows",
  "pvault_chats",
  "pvault_exports",
  "pvault_settings",
] as const;

const SYNC_FLAG = "pvault_sync_enabled";
const LAST_SYNC = "pvault_last_sync";

export function isSyncEnabled() {
  return localStorage.getItem(SYNC_FLAG) === "true";
}

export function setSyncEnabled(on: boolean) {
  localStorage.setItem(SYNC_FLAG, String(on));
}

export function lastSyncedAt(): Date | null {
  const raw = localStorage.getItem(LAST_SYNC);
  return raw ? new Date(raw) : null;
}

function snapshot() {
  const data: Record<string, unknown> = {};
  for (const key of LOCAL_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        data[key] = JSON.parse(raw);
      } catch {
        /* skip unreadable entries */
      }
    }
  }
  return data;
}

async function requireUser() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sign in to sync your workspace.");
  return data.user;
}

/** Push the device snapshot up. */
export async function pushToCloud() {
  const user = await requireUser();
  const { error } = await supabase
    .from("vault_snapshots")
    .upsert({ user_id: user.id, data: snapshot() as never, updated_at: new Date().toISOString() });
  if (error) throw error;
  localStorage.setItem(LAST_SYNC, new Date().toISOString());
}

/** Pull the cloud snapshot down, replacing local data. */
export async function pullFromCloud(): Promise<boolean> {
  const user = await requireUser();
  const { data, error } = await supabase
    .from("vault_snapshots")
    .select("data")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  const payload = data?.data as Record<string, unknown> | undefined;
  if (!payload) return false;
  for (const key of LOCAL_KEYS) {
    if (payload[key] !== undefined) localStorage.setItem(key, JSON.stringify(payload[key]));
  }
  localStorage.setItem(LAST_SYNC, new Date().toISOString());
  return true;
}

/** Fire-and-forget push, used after edits when sync is on. */
export function syncInBackground() {
  if (!isSyncEnabled()) return;
  void pushToCloud().catch(() => {
    /* offline is fine, the next sync catches up */
  });
}

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  return (data as Profile) ?? null;
}

export async function updateProfile(userId: string, values: Partial<Omit<Profile, "id">>) {
  const { error } = await supabase.from("profiles").update(values).eq("id", userId);
  if (error) throw error;
}
