/**
 * Prompt variables: {{name}} placeholders inside prompt content.
 * Parsing and filling stay purely in-memory, nothing is persisted here.
 */

const TOKEN = /\{\{\s*([\w.-]+)\s*\}\}/g;

/** Unique variable names, in the order they first appear. */
export function extractVariables(content: string): string[] {
  const found: string[] = [];
  for (const match of content.matchAll(TOKEN)) {
    const name = match[1];
    if (!found.includes(name)) found.push(name);
  }
  return found;
}

/** Replace every {{name}} with its value. Unfilled variables keep their placeholder. */
export function fillVariables(content: string, values: Record<string, string>): string {
  return content.replace(TOKEN, (whole, name: string) => {
    const value = values[name];
    return value && value.trim() ? value : whole;
  });
}

export function hasVariables(content: string): boolean {
  TOKEN.lastIndex = 0;
  return TOKEN.test(content);
}

/** Turn "campaign_name" into "Campaign name" for form labels. */
export function humanizeVariable(name: string): string {
  const spaced = name.replace(/[_.-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
