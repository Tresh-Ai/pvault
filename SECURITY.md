# Security Policy

## Supported versions

PVault ships as a single web app. Only the latest release on the `main` branch is supported. Fixes are not backported.

## Reporting a vulnerability

Please do **not** open a public GitHub issue.

- Preferred: use GitHub's **Report a vulnerability** button under the repository's Security tab (private advisory).
- Alternative: email **security@pvault.app** with the details.

Include: a description, the affected file or screen, reproduction steps, and the impact you believe it has. If you have a proof of concept, attach it.

You can expect an acknowledgement within 5 days, and a status update at least every 14 days until the issue is closed. If a fix is shipped, you will be credited in the release notes unless you ask otherwise. Please give us 90 days before public disclosure.

## Scope

In scope:

- Cross-site scripting or code execution through prompt, tool, flow, chat or imported backup content, including the markdown renderer
- Leakage of stored data or of the user's AI provider API key to any third party
- Service worker or cache poisoning that persists malicious code
- Flaws in import, export or backup handling that destroy or expose user data

Out of scope:

- Anything that requires physical or already-authenticated access to the user's unlocked device. PVault stores data in the browser's `localStorage` by design and does not claim to protect it from someone using your device.
- Missing security headers on a third party host you deployed to yourself
- Vulnerabilities in OpenRouter, or in a model provider, rather than in PVault
- Findings that only apply to a fork you modified

## Notes for self-hosters

PVault is a static app with no backend. If you deploy it, serve it over HTTPS, set a strict `Content-Security-Policy`, and do not add any proxy that logs prompt content or API keys.
