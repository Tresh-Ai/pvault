# Bolt's Journal - Critical Learnings

## 2025-09-23 - Batch Data Fetching in LocalStorage-backed APIs
**Learning:** Sequential project loops calling collection query helpers (`getProjectPrompts`, `getProjectTools`, `getProjectWorkflows`) trigger $O(N)$ repeated LocalStorage reads and `JSON.parse` operations ($3N+2$ reads for $N$ projects). Using `Promise.all` with single-pass collection helpers (`getAllPrompts`, `getAllTools`, `getAllWorkflows`) reduces this to 5 parallel reads, dramatically speeding up debounced live search in command palette / search UI.
**Action:** Always prefer batch collection fetching over looping through project IDs when performing cross-entity operations like global search and analytics.

## 2025-09-24 - Batch Collection Fetching in ProjectsList Overview
**Learning:** Initializing project list summary statistics sequentially inside `ProjectsList.tsx` by querying `getProjectPrompts` and `getProjectTools` for each project resulted in $3N+1$ sequential LocalStorage reads and `JSON.parse` operations. Fetching all collections concurrently via `Promise.all([dbHelpers.getAllProjects(), dbHelpers.getAllPrompts(), dbHelpers.getAllTools()])` and aggregating counts in a single in-memory pass reduces I/O calls to 3 parallel reads and removes sequential delay when rendering the projects list.
**Action:** Use batch collection fetching and single-pass aggregation when calculating entity metrics or list summaries in LocalStorage-backed views.
