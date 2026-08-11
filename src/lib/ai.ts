/**
 * Model providers - all local. Keys live on the device and are sent straight to
 * the provider, never to a PVault server.
 *
 * OpenRouter can be connected with OAuth (PKCE), so no key needs to be pasted.
 */

export type ProviderId = "openrouter" | "openai" | "anthropic" | "google";

export interface AISettings {
  provider: ProviderId;
  apiKey: string;
  model: string;
  modelName: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
}

export interface ProviderMeta {
  id: ProviderId;
  label: string;
  blurb: string;
  /** Where a user creates a key, for the providers that need one pasted. */
  keyUrl?: string;
  keyPrefix?: string;
  oauth?: boolean;
}

export const PROVIDERS: ProviderMeta[] = [
  {
    id: "openrouter",
    label: "OpenRouter",
    blurb: "One connection, hundreds of models including free ones. Connect in one tap, no key to copy.",
    oauth: true,
    keyUrl: "https://openrouter.ai/keys",
  },
  {
    id: "openai",
    label: "OpenAI",
    blurb: "GPT models straight from OpenAI with your own API key.",
    keyUrl: "https://platform.openai.com/api-keys",
    keyPrefix: "sk-",
  },
  {
    id: "anthropic",
    label: "Anthropic",
    blurb: "Claude models straight from Anthropic with your own API key.",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyPrefix: "sk-ant-",
  },
  {
    id: "google",
    label: "Google AI Studio",
    blurb: "Gemini models with a free-tier key from Google AI Studio.",
    keyUrl: "https://aistudio.google.com/apikey",
  },
];

export function providerMeta(id: ProviderId): ProviderMeta {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0];
}

const KEY = "pvault_ai";

export function getAISettings(): AISettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { provider: "openrouter", apiKey: "", model: "", modelName: "" };
    const parsed = JSON.parse(raw);
    return {
      provider: (parsed.provider as ProviderId) || "openrouter",
      apiKey: parsed.apiKey || "",
      model: parsed.model || "",
      modelName: parsed.modelName || "",
    };
  } catch {
    return { provider: "openrouter", apiKey: "", model: "", modelName: "" };
  }
}

export function saveAISettings(next: Partial<AISettings>) {
  const merged = { ...getAISettings(), ...next };
  localStorage.setItem(KEY, JSON.stringify(merged));
  return merged;
}

export function clearAISettings() {
  localStorage.removeItem(KEY);
}

export function isAIReady() {
  const s = getAISettings();
  return !!s.apiKey && !!s.model;
}

export function isFreeModel(m: ModelInfo) {
  const p = Number(m.pricing?.prompt ?? "1");
  const c = Number(m.pricing?.completion ?? "1");
  return p === 0 && c === 0;
}

/** Rough "good first" ranking so the list starts with models people should actually pick. */
const FAMILY_SCORE: [RegExp, number][] = [
  [/gemini-3|gemini-2\.5-pro/i, 100],
  [/claude.*(opus|sonnet)/i, 96],
  [/gpt-5|o4|o3/i, 94],
  [/gemini.*flash/i, 88],
  [/deepseek.*(r1|v3)/i, 86],
  [/llama-?4/i, 82],
  [/qwen.*(3|2\.5).*(72|235|instruct)/i, 78],
  [/mistral.*(large|medium)/i, 74],
  [/gpt-4o|gpt-4\.1/i, 72],
  [/llama-?3\.[13]/i, 66],
  [/gemma/i, 58],
  [/phi/i, 50],
];

export function scoreModel(m: ModelInfo) {
  let score = 30;
  for (const [re, s] of FAMILY_SCORE) {
    if (re.test(m.id) || re.test(m.name)) {
      score = s;
      break;
    }
  }
  if ((m.context_length ?? 0) >= 200000) score += 6;
  else if ((m.context_length ?? 0) >= 100000) score += 4;
  else if ((m.context_length ?? 0) >= 32000) score += 2;
  if (/preview|alpha|beta|experimental|:extended/i.test(m.id)) score -= 4;
  return score;
}

const sortModels = (models: ModelInfo[]) => models.sort((a, b) => scoreModel(b) - scoreModel(a));

/** Model catalogue for a provider. Only OpenRouter can be listed without a key. */
export async function fetchModels(provider: ProviderId, apiKey: string): Promise<ModelInfo[]> {
  if (provider === "openrouter") {
    const res = await fetch("https://openrouter.ai/api/v1/models");
    if (!res.ok) throw new Error("Could not load models from OpenRouter.");
    const json = await res.json();
    return sortModels((json.data || []) as ModelInfo[]);
  }

  if (!apiKey) throw new Error("Add your API key first to load the model list.");

  if (provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error("OpenAI rejected that key.");
    const json = await res.json();
    const chatty = (json.data || []).filter((m: { id: string }) => /^(gpt|o[134])/i.test(m.id));
    return sortModels(chatty.map((m: { id: string }) => ({ id: m.id, name: m.id })));
  }

  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/models?limit=100", {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
    });
    if (!res.ok) throw new Error("Anthropic rejected that key.");
    const json = await res.json();
    return sortModels(
      (json.data || []).map((m: { id: string; display_name?: string }) => ({
        id: m.id,
        name: m.display_name || m.id,
      })),
    );
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
  );
  if (!res.ok) throw new Error("Google rejected that key.");
  const json = await res.json();
  const usable = (json.models || []).filter((m: { supportedGenerationMethods?: string[] }) =>
    m.supportedGenerationMethods?.includes("generateContent"),
  );
  return sortModels(
    usable.map((m: { name: string; displayName?: string; inputTokenLimit?: number }) => ({
      id: m.name.replace(/^models\//, ""),
      name: m.displayName || m.name.replace(/^models\//, ""),
      context_length: m.inputTokenLimit,
    })),
  );
}

export interface ChatMessageInput {
  role: "system" | "user" | "assistant";
  content: string;
}

interface Endpoint {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
  /** Anthropic uses a different SSE shape. */
  anthropic?: boolean;
}

function buildEndpoint(s: AISettings, messages: ChatMessageInput[]): Endpoint {
  if (s.provider === "anthropic") {
    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    return {
      url: "https://api.anthropic.com/v1/messages",
      headers: {
        "x-api-key": s.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
        "Content-Type": "application/json",
      },
      body: {
        model: s.model,
        max_tokens: 4096,
        stream: true,
        system: system || undefined,
        messages: messages
          .filter((m) => m.role !== "system")
          .map((m) => ({ role: m.role, content: m.content })),
      },
      anthropic: true,
    };
  }

  if (s.provider === "google") {
    return {
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      headers: { Authorization: `Bearer ${s.apiKey}`, "Content-Type": "application/json" },
      body: { model: s.model, messages, stream: true },
    };
  }

  if (s.provider === "openai") {
    return {
      url: "https://api.openai.com/v1/chat/completions",
      headers: { Authorization: `Bearer ${s.apiKey}`, "Content-Type": "application/json" },
      body: { model: s.model, messages, stream: true },
    };
  }

  return {
    url: "https://openrouter.ai/api/v1/chat/completions",
    headers: {
      Authorization: `Bearer ${s.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-Title": "PVault",
    },
    body: { model: s.model, messages, stream: true },
  };
}

/** Streams a completion from whichever provider is connected. */
export async function streamChat(
  messages: ChatMessageInput[],
  onToken: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const settings = getAISettings();
  if (!settings.apiKey || !settings.model) {
    throw new Error("Connect a model provider in Settings first.");
  }

  const endpoint = buildEndpoint(settings, messages);
  const res = await fetch(endpoint.url, {
    method: "POST",
    headers: endpoint.headers,
    body: JSON.stringify(endpoint.body),
    signal,
  });

  if (!res.ok || !res.body) {
    let detail = "";
    try {
      const err = await res.json();
      detail = err?.error?.message || "";
    } catch {
      /* ignore */
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error(`${providerMeta(settings.provider).label} rejected your key. Reconnect it in Settings.`);
    }
    if (res.status === 402) throw new Error("This model needs credits on your account. Try a free model.");
    if (res.status === 429) throw new Error("Rate limited by the provider. Wait a moment and try again.");
    throw new Error(detail || "The AI request failed.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const delta = endpoint.anthropic
          ? parsed.type === "content_block_delta"
            ? parsed.delta?.text
            : undefined
          : parsed.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          onToken(delta);
        }
      } catch {
        /* partial json, ignore */
      }
    }
  }

  return full;
}

/* ------------------------------------------------------------------ */
/* OpenRouter OAuth (PKCE)                                             */
/* ------------------------------------------------------------------ */

const VERIFIER_KEY = "pvault_openrouter_verifier";

function randomString(length = 64) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[b % 62]).join("");
}

function base64Url(buffer: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function openRouterCallbackUrl() {
  return `${window.location.origin}/oauth/openrouter`;
}

/** Returns the URL to send the user to for OpenRouter consent. */
export async function buildOpenRouterAuthUrl() {
  const verifier = randomString(64);
  localStorage.setItem(VERIFIER_KEY, verifier);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = base64Url(digest);
  const params = new URLSearchParams({
    callback_url: openRouterCallbackUrl(),
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  return `https://openrouter.ai/auth?${params.toString()}`;
}

/** Exchanges the one-time code for a user-scoped OpenRouter key. */
export async function exchangeOpenRouterCode(code: string): Promise<string> {
  const codeVerifier = localStorage.getItem(VERIFIER_KEY);
  if (!codeVerifier) throw new Error("This connection attempt expired. Start again from Settings.");
  const res = await fetch("https://openrouter.ai/api/v1/auth/keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, code_verifier: codeVerifier, code_challenge_method: "S256" }),
  });
  localStorage.removeItem(VERIFIER_KEY);
  if (!res.ok) throw new Error("OpenRouter could not complete the connection.");
  const json = await res.json();
  if (!json.key) throw new Error("OpenRouter did not return a key.");
  return json.key as string;
}
