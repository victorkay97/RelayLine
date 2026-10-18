# RelayLine hosting and navigation — 18 October 2026

## Canonical hackathon site: GitHub Pages

- Public landing page: https://victorkay97.github.io/RelayLine/
- Publisher Workspace: https://victorkay97.github.io/RelayLine/workspace.html
- Public recovery reader: https://victorkay97.github.io/RelayLine/recover.html
- Documentation hub: https://victorkay97.github.io/RelayLine/docs.html

**This GitHub Pages deployment is the canonical navigable application for the current release.** All primary product navigation, in-workspace "Publish new service" and "Edit signed record" actions, post-publish receipt links and public reader links stay on this origin. The workspace exclusively hosts the three-step publishing wizard, with explicit EVM wallet approval, signed Arkiv transactions, and current-record checks. The public homepage has only Open workspace and Find a service as its primary calls to action.

The application is built with `npm run build -- --base=/RelayLine/`; links within HTML and JS are relative to the current page (do not write links beginning at `/` for GitHub project Pages). The Pages workflow publishes the `dist` artifact automatically from `main`: `.github/workflows/publish-pages.yml`. Legacy Vercel publisher deployments cannot be retroactively changed without another Vercel deployment; the free-account deployment quota was reached on 2026-10-18. Existing Vercel links may remain in previously distributed content but **are not the canonical navigation for this release**.

## Separate independent reader is still available

The separately hosted, read-only Vercel reader `https://relayline-reader.vercel.app/` remains online as an **optional, physically separate deployment** for a stronger demonstration of not depending on the publisher host. Its UI is a previously deployed version until a future Vercel deployment is possible. The Pages-hosted `/recover.html` is independently querying Arkiv without RelayLine backend and has the same trust-policy source code, **but shares an origin and hosting provider with the publisher UI**; avoid calling this particular copy independently hosted or host-fault tolerant.

## Trust and test data warnings

- Readers still require publisher identity obtained from an independently authenticated source. `?service=` and `?publisher=` URL parameters are a convenience, **never proof of authentic service ownership**.
- Wallet connection is not global proof of a service ID's ownership, and rotation may change who is an authorized signing wallet.
- Workspace counters mean currently queryable signed manifests, not uptime or the historical total number of publications.
- M6 `relayline-m6-oct18` was revoked as a deliberate fail-closed security test; it should not be presented as a working recovery route.

## Manual verification checklist

1. Open canonical GitHub Pages home; verify a centered hero with exactly two main actions (Open workspace and Find a service), no publishing form, and working Home / Find a service / Docs / Workspace navigation. Verify all routes remain under `victorkay97.github.io/RelayLine/`.
2. In Workspace click Publish new service. Verify that the on-page wizard opens without redirecting anywhere, including during a validation error.
3. Fill service, primary and backup URLs; check review displays the values. Only actual approved wallet signing may publish. Do not create unnecessary testnet writes during UI QA.
4. If you have an already authorized wallet-connected record, choose Edit signed record and verify the known destinations and next revision prefill in the same on-page wizard. The final write must still check Arkiv and ask for wallet approval.
5. Connect the actual original **M4 publisher wallet** to inspect its currently active manifests; Wallet B is a **different** test wallet used as M4 impostor, M5 monitor and M6 root. A revoked M6 service must not be advertised as a usable recovery route. Portfolio results are limited to currently queryable records created by that connected wallet.
6. Confirm all GitHub Pages routes use the new monochrome editorial design with restrained persimmon accents, a persistent light/dark switcher, a consistent shared footer, and a hamburger menu at ≤900px.
7. Open `/docs.html`, follow each sidebar anchor, and check the GitHub protocol/security/judging links.
8. The separately hosted Vercel reader is optional, and should not be a primary navigation destination.
