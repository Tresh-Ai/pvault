# Governance

PVault uses a simple "benevolent maintainer" model. It is small on purpose, and this document exists so expectations are clear rather than to add process.

## Roles

**Founder / Lead maintainer.** Owns the product direction, has final say on scope, releases and licensing. Currently the original author.

**Maintainers.** Can triage issues, review and merge pull requests, and cut releases. Appointed by the lead maintainer.

**Contributors.** Anyone who opens an issue, improves docs, or sends a pull request. No formal commitment required.

## How decisions are made

1. Most changes are decided in the issue or pull request by whoever reviews it.
2. Disagreements are discussed in the open. Maintainers look for consensus.
3. If consensus is not reached, the lead maintainer decides, and states the reason in the thread.

Decisions that always sit with the lead maintainer: licensing, the project name and branding, product scope, and anything touching the privacy promise.

## Product principles

These are the tie-breakers for "should this be in PVault?":

1. **Offline first.** The app must work with no network, forever.
2. **No accounts.** Using PVault never requires signing up.
3. **Local data.** User content stays on the device unless the user explicitly sends it somewhere.
4. **No tracking.** No analytics, no fingerprinting, no third party scripts on the critical path.
5. **Mobile first.** If it does not work well on a phone, it is not done.
6. **Small surface.** Fewer, better features over many shallow ones.

A proposal that breaks one of these is declined regardless of code quality.

## Becoming a maintainer

There is no application form. The path is: contribute meaningfully over time, review others' pull requests helpfully, and show judgment about scope. The lead maintainer will invite you. Maintainers who go inactive for six months may be moved to emeritus, with no hard feelings and a standing invitation to return.

## Changing this document

Open a pull request. Changes require the lead maintainer's approval.
