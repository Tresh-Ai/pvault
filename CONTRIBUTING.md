# Contributing to PVault

Thanks for wanting to help. PVault is a small, opinionated app, so the fastest way to get a change merged is to keep it focused.

## Ground rules

- Be kind. The [Code of Conduct](CODE_OF_CONDUCT.md) applies everywhere in this project.
- One concern per pull request. Split refactors away from features.
- PVault is offline first and account free. Changes that add a required backend, telemetry, tracking or a mandatory sign-in will be declined.
- Never send prompt content, chats or API keys anywhere except the AI provider the user explicitly configured.

## Setup

```bash
npm install
npm run dev      # http://localhost:8080
npm run lint
npm run build    # must pass before you open a PR
```

## Where things live

- `src/pages` route screens, `src/components` UI, `src/components/ui` shadcn primitives
- `src/lib/database.ts` projects, prompts, tools, settings
- `src/lib/workflows.ts` flows, `src/lib/chats.ts` chats, `src/lib/ai.ts` OpenRouter, `src/lib/theme.ts` theme
- Persistence belongs in `src/lib`. Components should not touch `localStorage` directly.

## Style

- TypeScript everywhere, no `any` unless you explain why in a comment.
- Tailwind with the semantic tokens from `src/index.css` (`bg-background`, `text-muted-foreground`, `bg-primary`). Never hardcode `text-white`, `bg-black` or hex colours; that breaks dark mode.
- Mobile first. Tap targets at least 44px. Test at 390px wide before you push.
- Keep components small and named. Prefer a new file over a 400 line component.

## Changing stored data

If you change a stored shape, you must keep existing users working:

1. Read defensively and fall back when a field is missing.
2. Migrate on read inside `src/lib`, never with a destructive rewrite.
3. Update the JSON backup export and import in `src/pages/Settings.tsx`.

## Commits and pull requests

- Conventional commit prefixes are appreciated: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.
- In the PR description, say what changed, why, and how you tested it. Screenshots or a short clip for anything visual, at mobile width.
- Add a line to `src/pages/Changelog.tsx` for user visible changes.

## Reporting bugs

Open an issue with: what you expected, what happened, the device and browser, and whether the app was installed or in a tab. If it involves stored data, a redacted JSON export helps a lot.

## Security

Do not open a public issue for a vulnerability. Follow [SECURITY.md](SECURITY.md).

## Licensing of contributions

By contributing you agree that your contribution is licensed under the project's AGPL v3.0 or later license, and that you have the right to submit it.
