/**
 * OpenRouter integration - local only.
 * The user's API key never leaves the device except to call OpenRouter directly.
 */

export interface AISettings {
  apiKey: string;
  model: string;
  modelName: string;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
}

const KEY = "pvault_ai";

export function getAISettings(): AISettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { apiKey: "", model: "", modelName: "" };
    const parsed = JSON.parse(raw);
    return {
      apiKey: parsed.apiKey || "",
      model: parsed.model || "",
      modelName: parsed.modelName || "",
    };
  } catch {
    return { apiKey: "", model: "", modelName: "" };
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

export function isFreeModel(m: OpenRouterModel) {
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

export function scoreModel(m: OpenRouterModel) {
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

export async function fetchModels(): Promise<OpenRouterModel[]> {
  const res = await fetch("https://openrouter.ai/api/v1/models");
  if (!res.ok) throw new Error("Could not load models from OpenRouter.");
  const json = await res.json();
  const models: OpenRouterModel[] = json.data || [];
  return models.sort((a, b) => scoreModel(b) - scoreModel(a));
}

export interface ChatMessageInput {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Streams a completion. onToken is called with each new chunk of text. */
export async function streamChat(
  messages: ChatMessageInput[],
  onToken: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const { apiKey, model } = getAISettings();
  if (!apiKey || !model) throw new Error("Add your OpenRouter key and pick a model first.");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-Title": "PVault",
    },
    body: JSON.stringify({ model, messages, stream: true }),
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
    if (res.status === 401) throw new Error("Your OpenRouter key was rejected. Check it in AI settings.");
    if (res.status === 402) throw new Error("This model needs credits on your OpenRouter account. Try a free model.");
    if (res.status === 429) throw new Error("Rate limited by OpenRouter. Wait a moment and try again.");
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
        const delta = parsed.choices?.[0]?.delta?.content;
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
