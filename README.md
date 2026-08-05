# PVault

**Keep your AI prompts, tools and flows together, by project. Offline first, private by default.**

PVault is an installable web app (PWA) for people who work with AI every day. Instead of scattering prompts across notes, screenshots and bookmarks, you organize them into projects, alongside the AI tools you use and repeatable flows that chain them together. Everything lives on your device.

- Projects that hold **Prompts**, **Tools**, **Flows** and **Chats**
- Markdown editor with live preview, formatting toolbar, autosave, undo/redo and version history
- **PVault AI**: bring your own OpenRouter key and run any saved prompt or flow in a built-in chat
- Open a prompt straight in ChatGPT, Claude or Gemini
- Export prompts as `.txt`, `.md` or `.json`, plus a full JSON backup
- Works fully offline, installable to your home screen
- No accounts, no servers, no tracking. Data is stored in your browser's `localStorage`

## Screens

Projects list, project view (Prompts / Tools / Flows / Chats), prompt editor, flow builder and runner, AI chat, AI setup, settings, changelog.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 + shadcn/ui |
| Routing | React Router |
| Storage | Browser `localStorage` (no backend) |
| AI | OpenRouter, called directly from the browser with the user's own key |
| Offline | Service worker + web app manifest |

## Getting started

Requirements: Node.js 18+ (or Bun 1.1+).

```bash
git clone https://github.com/<your-org>/pvault.git
cd pvault
npm install        # or: bun install
npm run dev        # or: bun run dev
```

The app runs at `http://localhost:8080`.

```bash
npm run build      # production build into dist/
npm run preview    # serve the production build locally
npm run lint       # eslint
```

The service worker is intentionally disabled in development and inside preview iframes, so test offline behaviour against `npm run build && npm run preview`.

## Project structure

```text
src/
  pages/        route level screens (ProjectsList, ProjectView, PromptEditor host, ChatView, AISettings, Settings, Changelog)
  components/   UI building blocks, onboarding, product tour, chat composer, cards
  components/ui shadcn primitives
  lib/          database.ts (projects/prompts/tools/settings), workflows.ts, chats.ts, ai.ts, export.ts, theme.ts
  hooks/        useOnboarding, use-editor-history, use-toast
public/         manifest, icons, robots, sitemap
```

All persistence goes through the helper modules in `src/lib`. Do not read or write `localStorage` directly from components.

## Privacy

PVault has no backend. Prompts, tools, flows, chats and your OpenRouter API key never leave your device except for the direct request PVault makes to OpenRouter on your behalf when you use PVault AI. Exports are plain, unencrypted files that you choose to download.

## Contributing

Issues and pull requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md) first. Security reports go through [SECURITY.md](SECURITY.md), not public issues.

Maintainers: see [MAINTAINING.md](MAINTAINING.md) for the release and triage process, and [OPEN_SOURCE_GUIDE.md](OPEN_SOURCE_GUIDE.md) for a plain-language explanation of how running this project works.

## License

Licensed under the Apache License 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
