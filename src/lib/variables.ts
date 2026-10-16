/**
 * Prompt variables: {{name}} placeholders inside prompt content.
 * Parsing and filling stay purely in-memory, nothing is persisted here.
 */

/** Unique variable names, in the order they first appear. */
export function extractVariables(content: string): string[] {
  if (!content) return [];
  // Bolt Performance Optimization:
  // 1. Use local RegExp instead of shared global RegExp instance to prevent stateful `lastIndex` mutation bugs.
  // 2. Use `Set` for O(1) deduplication instead of O(N) array lookup (`includes`) per match, reducing total extraction complexity from O(N^2) to O(N).
  const found = new Set<string>();
  const tokenRegex = /\{\{\s*([\w.-]+)\s*\}\}/g;
  for (const match of content.matchAll(tokenRegex)) {
    found.add(match[1]);
  }
  return Array.from(found);
}

/** Replace every {{name}} with its value. Unfilled variables keep their placeholder. */
export function fillVariables(content: string, values: Record<string, string>): string {
  if (!content) return "";
  const tokenRegex = /\{\{\s*([\w.-]+)\s*\}\}/g;
  return content.replace(tokenRegex, (whole, name: string) => {
    const value = values[name];
    return value && value.trim() ? value : whole;
  });
}

export function hasVariables(content: string): boolean {
  if (!content) return false;
  // Non-global regex tests existence in O(1) without advancing or polluting RegExp lastIndex state.
  return /\{\{\s*[\w.-]+\s*\}\}/.test(content);
}

/** Turn "campaign_name" into "Campaign name" for form labels. */
export function humanizeVariable(name: string): string {
  if (!name) return "";
  const spaced = name.replace(/[_.-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
