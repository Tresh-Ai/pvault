/**
 * Guarded service-worker registration.
 * Never registers in dev, inside an iframe, or in Lovable preview contexts.
 */

const SW_URL = "/sw.js";

function isBlockedContext(): boolean {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;

  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }

  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;

  if (new URLSearchParams(window.location.search).has("sw")) {
    if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  }

  return false;
}

async function unregisterAppWorkers() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations
        .filter((r) => {
          const script =
            r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
          return script.endsWith(SW_URL) || script.endsWith("/service-worker.js");
        })
        .map((r) => r.unregister()),
    );
  } catch {
    /* noop */
  }
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  if (isBlockedContext()) {
    void unregisterAppWorkers();
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(SW_URL, { scope: "/" }).catch(() => {
      /* offline support unavailable */
    });
  });
}
