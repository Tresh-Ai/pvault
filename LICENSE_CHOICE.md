# Choosing and keeping a license

PVault ships under the **GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)**. This page explains why, and what your options are if you fork it.

## Why AGPL for PVault

PVault is a web app. With a permissive license like MIT, anyone could take it, host a closed, ad-filled version, and never share their improvements. The AGPL closes that gap: it is the only common license where **running modified code as a network service** also triggers the obligation to publish the source of those modifications.

Practically, if someone forks PVault and deploys it:

- They must license their version under AGPL v3 too.
- They must offer their users the complete source of their modified version.
- They must keep the copyright and license notices in place.
- They may still charge money for it. Open source does not mean free of charge.

That matches the founder's intent: improvements to PVault flow back to PVault.

## What the AGPL does not do

- It does not stop commercial use, and it does not require anyone to send you their patches directly. They only have to publish them.
- It does not force PVault's own users to publish anything. Using the app is unrestricted.
- It does not stop **you**, the copyright holder, from also selling PVault under a different, proprietary license. That is dual licensing, and it only works if you own or have been assigned the rights to all the code, which is why the CLA note below matters.

## The alternatives, in one line each

| License | Effect | Good when |
| --- | --- | --- |
| **AGPL-3.0** | Network copyleft. Hosted forks must publish source. | You want contributions to come back, app is served over a network. This is PVault's choice. |
| **GPL-3.0** | Copyleft on distribution, but hosting is not distribution. | Desktop or CLI software. Too weak for a web app. |
| **MPL-2.0** | File level copyleft. Modified files stay open, new files can be closed. | You want a middle ground and easy corporate adoption. |
| **Apache-2.0** | Permissive, with an explicit patent grant. | Maximum adoption matters more than reciprocity. |
| **MIT** | Permissive, shortest text. | Libraries and snippets you want everyone to use. |
| **BUSL / "fair source"** | Source visible, commercial hosting restricted for a few years, then converts to open source. Not an OSI open source license. | You plan to sell a hosted version and want to block competitors. |

## If you change the license

You can only relicense code you own or have permission to relicense. Once outside contributors merge patches under AGPL, you cannot silently switch to a permissive or proprietary license. Your options are:

1. Add a **Contributor License Agreement** or a Developer Certificate of Origin sign-off from the start, so contributors grant you the rights you need. `CONTRIBUTING.md` already includes a lightweight inbound licensing statement.
2. Get written agreement from every contributor whose code is still in the tree.
3. Remove or rewrite the affected contributions.

Do this before the project gets popular. Retroactive relicensing is the single most painful mistake in open source.

## Housekeeping to keep valid

- `LICENSE` holds the unmodified license text. Never edit it.
- `NOTICE` holds the copyright line and the source-availability reminder. Update the year and the repository URL.
- Keep the license badge and license section in `README.md` accurate.
- Dependencies carry their own licenses. Before adding one, check it is permissive or AGPL compatible. Avoid anything with a "no commercial use" or "source available only" clause.
