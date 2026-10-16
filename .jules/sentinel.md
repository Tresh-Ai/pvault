## 2025-02-22 - Unsanitized User URLs Executed via window.open
**Vulnerability:** User-defined tool URLs (or imported project backup files containing tool metadata) were directly passed to `window.open(tool.url, '_blank')` without scheme validation or window feature options.
**Learning:** External links or tool URLs provided by users or imported JSON backups could contain `javascript:`, `data:`, or `vbscript:` schemes allowing arbitrary client-side code execution (XSS) in the app context. Moreover, opening windows without `noopener,noreferrer` enabled reverse tabnabbing.
**Prevention:** Always sanitize external user-provided URLs using protocol checks (restricted to `http:` and `https:`) and open external links using `window.open(url, "_blank", "noopener,noreferrer")`.
