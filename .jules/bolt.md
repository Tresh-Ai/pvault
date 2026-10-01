# Bolt's Journal - Critical Learnings

## 2025-09-23 - Memoizing List Card Components to Prevent Unnecessary Re-renders
**Learning:** React list views (e.g. `ProjectView` and `Library`) re-render all card items when search queries, filter selections, or active tab changes trigger state updates in parent components. Wrapping list item components like `PromptCard` in `React.memo` prevents unnecessary child DOM reconciliation and re-rendering across large collections.
**Action:** Always wrap frequently rendered list card components in `React.memo` when their props are stable or simple value primitives.

## 2025-09-23 - Batch Data Fetching in LocalStorage-backed APIs
**Learning:** Sequential project loops calling collection query helpers (`getProjectPrompts`, `getProjectTools`, `getProjectWorkflows`) trigger $O(N)$ repeated LocalStorage reads and `JSON.parse` operations ($3N+2$ reads for $N$ projects). Using `Promise.all` with single-pass collection helpers (`getAllPrompts`, `getAllTools`, `getAllWorkflows`) reduces this to 5 parallel reads, dramatically speeding up debounced live search in command palette / search UI.
**Action:** Always prefer batch collection fetching over looping through project IDs when performing cross-entity operations like global search and analytics.
