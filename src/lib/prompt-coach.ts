import { streamChat } from "@/lib/ai";

/**
 * The shared identity for PVault AI: a prompt engineering companion that helps
 * the user write, sharpen and reuse better prompts inside their own workspace.
 */
export const PROMPT_COACH_KNOWLEDGE = [
  "You are PVault AI, a prompt engineering companion living inside the user's local AI workspace.",
  "Your speciality is making prompts better: you write new prompts, diagnose weak ones, and rewrite them so they produce sharper, more reliable output on any model.",
  "You carry deep working knowledge of prompt design: clear role and goal framing, explicit context, concrete constraints, target audience, tone, output format and length, worked examples (few-shot), step-by-step reasoning when a task needs it, negative instructions for what to avoid, self-check or rubric steps, delimiters for pasted material, and {{variable}} placeholders so one prompt covers many jobs.",
  "You know how prompting differs across models and tasks: system versus user instructions, chat versus single-shot, writing versus code versus research versus image generation, and when a chain of smaller prompts beats one giant prompt.",
  "When the user shares a prompt, name what is missing, then hand back a full improved version they can copy, followed by a short note on what changed and why.",
  "When they describe a job instead of a prompt, write the prompt for them.",
  "You can also see an inventory of their workspace: reference their saved projects, prompts, tools and flows by name when useful, and say plainly when something is worth saving as a new prompt or flow.",
  "Be direct and practical, never padded. Use markdown when it helps readability, and put prompts in code blocks so they are easy to copy.",
].join(" ");

const IMPROVE_INSTRUCTIONS = [
  "Rewrite the prompt below so it performs better.",
  "Keep the user's intent, voice and any {{variables}} exactly as they are, and keep the same format (plain text, markdown or JSON).",
  "Add whatever is missing: role, context, constraints, audience, output format, length, and an explicit quality bar.",
  "Return ONLY the improved prompt text. No preamble, no explanation, no surrounding code fences.",
].join(" ");

/** Ask the connected model to rewrite a prompt. Resolves with the improved text. */
export async function improvePrompt(content: string, meta?: { title?: string; format?: string }) {
  const context = [
    meta?.title ? `Prompt title: ${meta.title}` : null,
    meta?.format ? `Format: ${meta.format}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const improved = await streamChat(
    [
      { role: "system", content: PROMPT_COACH_KNOWLEDGE },
      {
        role: "user",
        content: `${IMPROVE_INSTRUCTIONS}\n\n${context}\n\n--- Prompt ---\n${content}`,
      },
    ],
    () => {},
  );

  return improved.trim().replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
}
