# Architecture decisions

- Keep prompt, project, and tool content in local storage by default; Cloud is used only for explicit backup and published share snapshots so offline use stays private by default.
- Public prompt links use immutable Cloud snapshots, owner-only creation, and a curated anonymous read path so visitors can view shared content without exposing owner records.
- Share activity is stored as aggregate counters updated through a restricted database function so anonymous visitors cannot edit share content or owner data.
- Lovable AI Gateway calls run in authenticated Cloud Edge Functions so prompts and gateway credentials stay off the browser.