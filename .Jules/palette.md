## 2025-05-18 - Tooltip Wrapper Pattern for Radix Tooltips
**Learning:** Wrapping Radix DropdownMenuTrigger with asChild inside TooltipTrigger asChild allows accessible tooltips on dropdown triggers without breaking menu interactions.
**Action:** When adding tooltips to dropdown triggers, nesting `<Tooltip><TooltipTrigger asChild><DropdownMenuTrigger asChild><Button ... /></DropdownMenuTrigger></TooltipTrigger></Tooltip>` preserves both keyboard/hover tooltip hints and popover functionality.
