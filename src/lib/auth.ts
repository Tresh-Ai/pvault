import { supabase } from "@/integrations/supabase/client";

/** Remove any OAuth tokens that a provider redirect may have left in the address bar. */
export function stripAuthParamsFromUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const dirty = ["access_token", "refresh_token", "provider_token", "code", "expires_in", "token_type"];
  let changed = false;

  dirty.forEach((key) => {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  });

  if (url.hash && dirty.some((key) => url.hash.includes(`${key}=`))) {
    url.hash = "";
    changed = true;
  }

  if (changed) {
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }
}

/** Clear every locally cached auth token, including stale keys from earlier sessions. */
export function clearLocalAuthStorage() {
  if (typeof window === "undefined") return;
  const isAuthKey = (key: string) =>
    (key.startsWith("sb-") && key.includes("auth-token")) ||
    key.startsWith("supabase.auth.") ||
    key.startsWith("pvault_oauth_");

  [localStorage, sessionStorage].forEach((store) => {
    const keys: string[] = [];
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (key && isAuthKey(key)) keys.push(key);
    }
    keys.forEach((key) => store.removeItem(key));
  });
}

/**
 * Sign out and leave nothing behind: server session revoked, local tokens cleared,
 * and no provider tokens left in the URL.
 */
export async function signOutEverywhere() {
  try {
    await supabase.auth.signOut({ scope: "global" });
  } catch {
    // Offline or already expired: still clear the local copy below.
  }
  clearLocalAuthStorage();
  stripAuthParamsFromUrl();
}
