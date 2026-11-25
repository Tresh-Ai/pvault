import { Fragment, type ReactNode } from "react";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function SearchHighlight({ text, query }: { text: string; query: string }): ReactNode {
  const terms = [...new Set(query.trim().split(/\s+/).filter(Boolean))];
  if (terms.length === 0) return text;

  const matcher = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "ig");
  const matches = new Set(terms.map((term) => term.toLocaleLowerCase()));

  return text.split(matcher).map((part, index) =>
    matches.has(part.toLocaleLowerCase()) ? (
      <mark key={`${part}-${index}`} className="rounded-sm bg-primary/20 text-foreground">
        {part}
      </mark>
    ) : (
      <Fragment key={`${part}-${index}`}>{part}</Fragment>
    ),
  );
}