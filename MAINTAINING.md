# Maintaining PVault

The operational handbook for whoever holds the keys. Written for the founder, useful for any co-maintainer.

## Weekly rhythm

- **Triage new issues** (15 minutes). Label, ask for the missing detail, close what is out of scope with a kind sentence. An unanswered issue is worse than a closed one.
- **Review open pull requests.** A PR that sits for two weeks usually dies, and so does the contributor.
- **Skim dependency alerts.** Patch anything with a known exploit path.

## Issue labels

`bug`, `enhancement`, `ux`, `docs`, `offline`, `ai`, `good first issue`, `help wanted`, `needs info`, `wontfix`, `duplicate`.

Mark 3 to 5 issues as `good first issue` at all times. That is how new contributors arrive.

## Reviewing a pull request

Check in this order:

1. Does it fit the product? Offline first, no accounts, no tracking, mobile first. If not, decline early and explain.
2. Does `npm run build` and `npm run lint` pass?
3. Does it touch stored data? Then existing users' `localStorage` must keep working, and the JSON backup export/import must stay in sync.
4. Semantic Tailwind tokens only, no hardcoded colours, works in dark mode.
5. Tested at 390px wide.
6. Changelog entry added for user visible changes.

Say yes or no clearly. "Thanks, this is not a direction I want to take PVault" is a complete and respectful review.

## Release process

PVault uses simple `MAJOR.MINOR` versions.

- **MINOR** for new features and fixes (1.1, 1.2).
- **MAJOR** for a redesign or a breaking data change (2.0).

Steps:

1. Add the release section at the top of `src/pages/Changelog.tsx`, mark it `current: true`, and remove `current` from the previous one.
2. Bump the version in these places, they must all match:
   - `src/pages/Changelog.tsx`
   - `src/pages/Settings.tsx` (About section, and the `version` field in the JSON backup)
   - `src/pages/ProjectsList.tsx` and `src/components/onboarding/WelcomeScreen.tsx` (the `v1.x` badge)
   - `index.html` (`softwareVersion` in the JSON-LD block)
   - `public/manifest.json` (app name/description if it mentions the version)
3. Update `src/components/update-dialog.tsx` and bump its seen-key so existing users get the "what's new" popup once.
4. Add slides to `src/components/onboarding/OnboardingSlides.tsx` if the release introduces a concept new users would not guess.
5. `npm run build && npm run preview`, then verify: install prompt, offline reload, theme after refresh on a deep route, prompt editor autosave, flow run, AI chat.
6. Tag the release (`git tag v1.1 && git push --tags`) and write GitHub release notes that mirror the changelog.
7. Deploy the static `dist/` output.

## Offline and service worker care

The service worker is the easiest thing to break. After every release, load the app, go offline, and reload. If assets are missing, the precache manifest is wrong. Never ship a service worker that caches the HTML shell without a version bump, or returning users will be stuck on old code.

## Data and migrations

Everything lives in `localStorage` under `pvault_*` keys. Rules:

- Never delete or overwrite a key you did not create in the same release.
- Migrate on read, with defaults for missing fields.
- Anything destructive is user initiated, confirmed, and preceded by an offer to export a backup.

## AI provider

PVault calls OpenRouter directly from the browser with the user's own key. The key stays in `localStorage`, is never logged, and is never sent anywhere else. If OpenRouter changes its API, fix `src/lib/ai.ts` and nothing else. Do not add a server-side proxy, it would break the privacy promise.

## Bus factor

Add a second maintainer with commit rights before you need one. Write down where the domain, the deploy target and the DNS live, and store recovery codes somewhere your future self can reach.

## Saying no

The strongest maintenance tool is a polite refusal. PVault stays good by staying small. Features that need a backend, an account, a subscription check inside the app, or analytics do not belong here.
