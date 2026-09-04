# Open source, explained for the founder

You built PVault. You are about to publish the source code. This is the plain-language version of what that actually means, what changes for you, and what to do in the first month.

## 1. What open sourcing does and does not do

**It does:** let anyone read, run, study, modify and share the code, under the rules of your license (AGPL v3 for PVault, see `LICENSE_CHOICE.md`).

**It does not:** give away your ownership. You still hold the copyright to the code you wrote. You still own the name "PVault", the logo, the domain, the hosted deployment and the audience. A license covers code, not brand and not trust.

**It does not** mean free labour arrives. Most open source projects get few or no contributors. Publish because it builds trust in a privacy-first app, not because you expect a team.

## 2. Your two hats

- **Author:** you wrote it, you keep the copyright.
- **Maintainer:** you decide what gets merged, what ships, and what the project is for.

The second hat is a job. Budget 30 to 60 minutes a week. `MAINTAINING.md` is the checklist for it.

## 3. What people are allowed to do with PVault

Under AGPL v3, anyone may:

- run it privately, modify it, and use it commercially
- redistribute it, or host their own version

but if they distribute or host a modified version, they must:

- publish their full modified source under AGPL v3 as well
- keep your copyright and license notices intact
- tell their users where to get the source

That is the "they have to keep sharing back" property you wanted. It is enforced by copyright law, not by GitHub, and enforcement is ultimately your choice to pursue. In practice, a polite email resolves almost every violation.

## 4. Protecting the brand while sharing the code

Trademark and copyright are separate. Keep the name and logo yours:

- Only your official builds should be called "PVault". Ask forks to rename.
- Add a short trademark line to `README.md` if this matters to you: "PVault and the PVault logo are trademarks of the author. Forks must use a different name and logo."
- Keep control of the domain, the app store listings, and the social handles.

## 5. Can you still make money?

Yes, and open source does not block any of these:

- **Hosted convenience:** you run the official, always-updated instance. Most people will never self-host.
- **Sponsorship:** GitHub Sponsors, Ko-fi, or the newsletter you already run.
- **Paid add-ons around the core:** sync, backup, team sharing, published as separate services.
- **Dual licensing:** sell a proprietary license to companies that cannot accept AGPL. This only works if you own all the rights, which is why `CONTRIBUTING.md` includes an inbound licensing statement. Add a formal CLA if dual licensing is a real plan.
- **Support and consulting.**

What you should not do is ship a check inside this repo that disables features unless someone pays. Anyone can delete it, and it sours the community.

## 6. The files in this repo and why they exist

| File | Purpose |
| --- | --- |
| `README.md` | The front door. What it is, how to run it, how to help. |
| `LICENSE` | The legal terms. Unmodified AGPL v3 text. |
| `NOTICE` | Your copyright line and source-availability reminder. |
| `LICENSE_CHOICE.md` | Why AGPL, what the alternatives mean, how to relicense safely. |
| `CONTRIBUTING.md` | How to set up, code style, PR rules, inbound licensing. |
| `CODE_OF_CONDUCT.md` | Behaviour standards and how to report problems. |
| `SECURITY.md` | Private channel for vulnerabilities, and what is in scope. |
| `SUPPORT.md` | Where users should ask questions, so issues stay clean. |
| `MAINTAINING.md` | Your release and triage handbook. |
| `GOVERNANCE.md` | Who decides what, and how someone becomes a maintainer. |
| `CHANGELOG.md` | Human readable history, mirrored in the in-app changelog. |
| `.github/` | Issue and PR templates, funding link, CI. |

## 7. First month checklist

1. Push the repo public with all the files above. Fill in every `<your-org>` placeholder and the contact email addresses.
2. Turn on GitHub Discussions for questions, and private vulnerability reporting under Settings, Security.
3. Add repository topics: `pwa`, `react`, `typescript`, `ai`, `prompt-management`, `offline-first`, `local-first`.
4. Protect `main`: require a pull request, and require the build to pass.
5. Add a CI workflow that runs install, lint and build on every PR.
6. Label 3 to 5 `good first issue` items.
7. Write the launch post for your newsletter and for Hacker News / Reddit: the problem, the privacy stance, a screenshot, the license, and what help you want.
8. Add a second maintainer, or at least document where the domain and deploy credentials live.

## 8. Things that go wrong, and the fix

| Problem | Fix |
| --- | --- |
| Feature requests pile up | Say no fast and kindly. Point at the product principles in `CONTRIBUTING.md`. |
| A giant unsolicited PR arrives | Ask for an issue and a plan before code, next time. Review the parts you want, decline the rest. |
| Someone hosts a closed fork | Email them the AGPL obligation, politely. Escalate only if ignored. |
| A contributor is hostile | Enforce the Code of Conduct. That is what it is for. |
| Burnout | Ship less, slower. Archive is better than abandoned; a clear "maintenance mode" note in the README is respectable. |

## 9. The one rule

Be the kind of maintainer you would want to contribute to: answer quickly, decide clearly, and keep your promises about privacy. The code is the small part. The trust is the project.
