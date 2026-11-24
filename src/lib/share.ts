/**
 * Share links carry the prompt inside the URL fragment (#p=...), so they work
 * offline, need no server, and the content is never sent in a request path.
 */
export interface SharedPrompt {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  format?: "text" | "json" | "markdown";
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function encodeShare(p: SharedPrompt): string {
  const data = { t: p.title, c: p.content, k: p.category, g: p.tags, f: p.format };
  return toBase64Url(new TextEncoder().encode(JSON.stringify(data)));
}

export function decodeShare(code: string): SharedPrompt | null {
  try {
    const d = JSON.parse(new TextDecoder().decode(fromBase64Url(code)));
    if (typeof d?.c !== "string") return null;
    return {
      title: typeof d.t === "string" ? d.t : "",
      content: d.c,
      category: typeof d.k === "string" ? d.k : undefined,
      tags: Array.isArray(d.g) ? d.g.filter((x: unknown) => typeof x === "string") : [],
      format: ["text", "json", "markdown"].includes(d.f) ? d.f : "text",
    };
  } catch {
    return null;
  }
}

export function shareUrl(p: SharedPrompt, origin = window.location.origin): string {
  return `${origin}/share#p=${encodeShare(p)}`;
}
