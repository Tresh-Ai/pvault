# Bolt's Journal - Critical Learnings

## 2025-09-23 - Batch Data Fetching in LocalStorage-backed APIs
**Learning:** Sequential project loops calling collection query helpers (`getProjectPrompts`, `getProjectTools`, `getProjectWorkflows`) trigger $O(N)$ repeated LocalStorage reads and `JSON.parse` operations ($3N+2$ reads for $N$ projects). Using `Promise.all` with single-pass collection helpers (`getAllPrompts`, `getAllTools`, `getAllWorkflows`) reduces this to 5 parallel reads, dramatically speeding up debounced live search in command palette / search UI.
**Action:** Always prefer batch collection fetching over looping through project IDs when performing cross-entity operations like global search and analytics.

## 2025-09-24 - Stateless Regex and Set Deduplication in Template Variable Extraction
**Learning:** Shared global RegExp instances (`/g`) mutate `lastIndex` across calls (e.g., `test()`), causing unpredictable state bugs and skipped matches when combined with `matchAll` or `replace`. Additionally, deduplicating parsed variable tags via `Array.prototype.includes` results in $O(N^2)$ quadratic scanning for large templates. Using local RegExp instances and JS `Set` deduplication achieves $O(N)$ linear extraction with $O(1)$ lookup while guaranteeing insertion order.
**Action:** Use local RegExp instances and `Set` for deduplication in string template parsing routines.
