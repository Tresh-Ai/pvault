# Bolt's Journal - Critical Learnings

## 2025-09-23 - Batch Data Fetching in LocalStorage-backed APIs
**Learning:** Sequential project loops calling collection query helpers (`getProjectPrompts`, `getProjectTools`, `getProjectWorkflows`) trigger $O(N)$ repeated LocalStorage reads and `JSON.parse` operations ($3N+2$ reads for $N$ projects). Using `Promise.all` with single-pass collection helpers (`getAllPrompts`, `getAllTools`, `getAllWorkflows`) reduces this to 5 parallel reads, dramatically speeding up debounced live search in command palette / search UI.
**Action:** Always prefer batch collection fetching over looping through project IDs when performing cross-entity operations like global search and analytics.

## 2025-10-15 - Fast-path ISO Date Reviver & Single-pass Migration Reads
**Learning:** Calling `migratePromptsToVersioning()` before reading prompts caused double LocalStorage reads and JSON parsing passes on every prompt query (`getAllPrompts`, `getProjectPrompts`). Returning loaded prompts directly from migration eliminates the redundant second read. Additionally, checking string length (`19..28`) and character delimiter (`charCodeAt(10) === 84`) in `JSON.parse` reviver callbacks bypasses expensive regex evaluation on 99%+ of non-date string properties (such as large prompt and chat message contents).
**Action:** Always pass through loaded collections from migration helpers, and fast-path type indicators before executing regexes inside `JSON.parse` reviver callbacks.
