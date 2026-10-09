# Bolt's Journal - Critical Learnings

## 2025-09-23 - Batch Data Fetching in LocalStorage-backed APIs
**Learning:** Sequential project loops calling collection query helpers (`getProjectPrompts`, `getProjectTools`, `getProjectWorkflows`) trigger $O(N)$ repeated LocalStorage reads and `JSON.parse` operations ($3N+2$ reads for $N$ projects). Using `Promise.all` with single-pass collection helpers (`getAllPrompts`, `getAllTools`, `getAllWorkflows`) reduces this to 5 parallel reads, dramatically speeding up debounced live search in command palette / search UI.
**Action:** Always prefer batch collection fetching over looping through project IDs when performing cross-entity operations like global search and analytics.

## 2025-09-24 - Fast Early Substring Checks Before Regex Matching in Frequent React Re-evaluations
**Learning:** Functions like variable parsing/filling (`extractVariables`, `fillVariables`, `hasVariables`) run on every keystroke/render cycle in prompt editors. Running regex engine searches on every text update for plain text prompts allocates iterator objects and executes regular expression scans needlessly. Adding an $O(1)$ fast substring check `if (!content || !content.includes("{{")) return ...` bypasses regex execution and string allocation entirely for non-templated text (90%+ of cases).
**Action:** Always use fast `String.prototype.includes` substring guards before executing regular expressions in high-frequency React hooks and text processing functions.
