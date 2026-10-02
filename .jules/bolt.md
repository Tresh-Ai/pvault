# Bolt's Journal - Critical Learnings

## 2025-09-24 - Eliminating Redundant Reads in Migration-Gated Collection Helpers
**Learning:** Migration guard functions like `migratePromptsToVersioning()` that load and parse collection data from LocalStorage should return the parsed data directly. Returning `Promise<Prompt[]>` instead of `Promise<void>` prevents downstream collection functions (`getProjectPrompts`, `getAllPrompts`) from performing a second consecutive `storage.get()` and `JSON.parse` call.
**Action:** When a collection function requires a migration or validation step, design the guard helper to return the loaded dataset so callers can consume it without redundant I/O and JSON parsing overhead.

## 2025-09-23 - Batch Data Fetching in LocalStorage-backed APIs
**Learning:** Sequential project loops calling collection query helpers (`getProjectPrompts`, `getProjectTools`, `getProjectWorkflows`) trigger $O(N)$ repeated LocalStorage reads and `JSON.parse` operations ($3N+2$ reads for $N$ projects). Using `Promise.all` with single-pass collection helpers (`getAllPrompts`, `getAllTools`, `getAllWorkflows`) reduces this to 5 parallel reads, dramatically speeding up debounced live search in command palette / search UI.
**Action:** Always prefer batch collection fetching over looping through project IDs when performing cross-entity operations like global search and analytics.
