# Changelog

All notable changes to PVault. This mirrors the in-app changelog at `/changelog`.

## [1.1] - 2026-08

### Added
- **PVault AI**: built-in chat powered by your own OpenRouter key, so saved prompts can be run without leaving the app.
- Guided AI setup that explains why OpenRouter and how to get a key, with a searchable model list that surfaces free and high quality models first.
- ChatGPT style chat surface: fixed auto-growing composer, expand to editor, stop streaming, editable and copyable messages, regenerate, and jump to latest.
- Attach saved prompts, tools and flows as chat context with the + button.
- Run a whole flow in the AI, with every step handed over in order.
- New **Chats** tab in each project, so you can see where a prompt or flow was used.
- Open any prompt directly in ChatGPT, Claude or Gemini from the editor.
- Onboarding slides covering flows, PVault AI and chats.
- What's new dialog for existing users after an update.

### Fixed
- Theme now applies on every route and survives a refresh, including system mode.
- Project tabs no longer overflow their pill on small phones.
- Chat drafts and in progress answers survive an accidental refresh.
- Undo and redo moved into the scrollable editor toolbar so the top bar stays stable.

## [1.0] - 2026-07

### Added
- Complete visual rebuild: minimalist black and white system with a single green accent, new vault logo, favicon and app icons.
- Rebuilt prompt editor with separate title and content fields, markdown format with live preview, a formatting toolbar, autosave with configurable frequency, manual save, automatic hashtag extraction and single step version history.
- Workflows: chain prompts, tools and notes into repeatable sequences and run them step by step.
- Projects with Prompts, Tools and Flows tabs, scoped search and filters.
- Export prompts as `.txt`, `.md` or `.json`, plus a full JSON backup from Settings.
- Real service worker with precaching, and an install as app prompt with platform specific instructions including iOS.
- Modern onboarding plus a guided in-app tour.
- Full SEO pass: titles, descriptions, OpenGraph and Twitter cards, JSON-LD, sitemap and robots.
- Newsletter signup so PVault stays free to use.

### Changed
- Persistence moved to `localStorage` only, for offline stability.
- Card menus (edit, export, delete) are always visible instead of hover only.

## [0.9] - Beta

### Added
- First working build: projects, prompts and tools with local persistence.
- Basic search, favourites, usage tracking, and text and JSON exports.
