# Bolt's Journal - Critical Learnings

## 2025-10-15 - Single-pass Filter Options Aggregation in React
**Learning:** Re-calculating filter dropdown options and filtering items without `useMemo` in component render functions causes multi-pass $O(P \cdot (C+T))$ iterations on every render (e.g. keypresses, state changes). Computing filter options via single-pass `Map` aggregation and wrapping both filter options and filtered list in `useMemo` eliminates unnecessary array allocations and string operations, reducing render latency from linear to near zero on state changes.
**Action:** Use `useMemo` with single-pass `Map` iterations for filter option counts and search/filter list computations.

## 2025-09-23 - Batch Data Fetching in LocalStorage-backed APIs
**Learning:** Sequential project loops calling collection query helpers (`getProjectPrompts`, `getProjectTools`, `getProjectWorkflows`) trigger $O(N)$ repeated LocalStorage reads and `JSON.parse` operations ($3N+2$ reads for $N$ projects). Using `Promise.all` with single-pass collection helpers (`getAllPrompts`, `getAllTools`, `getAllWorkflows`) reduces this to 5 parallel reads, dramatically speeding up debounced live search in command palette / search UI.
**Action:** Always prefer batch collection fetching over looping through project IDs when performing cross-entity operations like global search and analytics.
