## 2025-05-18 - Batch Sequential DB Lookups in Async Search
**Learning:** In local IndexedDB/localStorage abstraction wrappers (like `dbHelpers` and `workflowHelpers`), calling async getters inside `for...of` loops sequentializes async ticks ($O(N)$ wait overhead). Batching with `Promise.all` executes queries concurrently ($O(1)$ async wait steps).
**Action:** When querying sub-items across collections or lists (e.g. project prompts/tools/workflows), always map over the collection and wrap with `Promise.all`.
