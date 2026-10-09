/**
 * Prompt variables: {{name}} placeholders inside prompt content.
 * Parsing and filling stay purely in-memory, nothing is persisted here.
 */

/** Unique variable names, in the order they first appear. */
export function extractVariables(content: string): string[] {
  if (!content || !content.includes("{{")) return [];
  const found: string[] = [];
  const matches = content.matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g);
  for (const match of matches) {
    const name = match[1];
    if (!found.includes(name)) found.push(name);
  }
  return found;
}

/** Replace every {{name}} with its value. Unfilled variables keep their placeholder. */
export function fillVariables(content: string, values: Record<string, string>): string {
  if (!content || !content.includes("{{")) return content;
  return content.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (whole, name: string) => {
    const value = values[name];
    return value && value.trim() ? value : whole;
  });
}

export function hasVariables(content: string): boolean {
  if (!content || !content.includes("{{")) return false;
  return /\{\{\s*([\w.-]+)\s*\}\}/.test(content);
}

/** Turn "campaign_name" into "Campaign name" for form labels. */
export function humanizeVariable(name: string): string {
  const spaced = name.replace(/[_.-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
