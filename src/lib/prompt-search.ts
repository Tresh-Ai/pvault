export function promptMatchesQuery(title: string, content: string, query: string) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

  const searchable = `${title}\n${content}`.toLocaleLowerCase();
  return terms.every((term) => searchable.includes(term));
}