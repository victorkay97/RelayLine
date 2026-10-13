# RelayLine UX & Visual Quality Acceptance (2026-10-13)

## Product-first principle
A publisher should be able to understand why recovery matters, connect a wallet, enter a primary/fallback and publish an attributable record without knowing the word "manifest" in advance. A reader needs no wallet but **must** authenticate/pin the publisher root wallet before trusting a recovery destination. No UI shortcut may silently bypass that trust requirement.

## Design system
- Geist Variable for headings/product voice, Inter Variable for body, inputs and supporting UI. Both self-hosted in Vite assets via Fontsource, no external runtime font CDN.
- Restrained deep pine/graphite base, mineral green highlights, sharp lime accent and warm-white text.
- Lucide icon pack, 18–20px primary UI, 1.85px stroke (no Unicode arrows used as interaction icons).
- Responsive nav that retains access to both publisher and reader; minimum 44x44 mobile interactive targets.
- Keyboard-visible focus, real labels/assistive hints, aria-live request feedback, reduced-motion support and honest loading/empty/error states.

## Journeys
1. Publisher: learn → identify service → add HTTPS primary/fallback → connect Tiramisu wallet → review signer/fee/publicness → sign → copy entity and open separate reader.
2. Existing publisher: enter known service, connect verified root signer, load latest on-chain revision (read-only), prefill next revision for safe publication; never claim the app manages a service until the user signs.
3. Reader: enter service ID → enter publisher root from an authenticated channel → explicitly pin → query direct Arkiv → review authorized endpoints and actual chain evidence.
4. Reader errors: refuse missing/mismatched pin, conflicting signatures, invalid/expired records, unavailable RPC, empty result. Never invent green status.
5. Advanced: monitor verification optional and disabled by default; unknown status should be clear without implying the fallback is unavailable.

## QA gates
- [x] Automated Playwright scenarios authored for desktop, 375px and 320px, with CI execution gate pending: mobile and desktop, form errors, keyboard navigation, wallet missing/refused, mock successful write, pinned-root recovery, attacker/expired states.
- [ ] Test UI on real browser engines, 320px/375px/768px/1440px widths with no sideways scroll.
- [ ] CI automated axe-core WCAG A/AA (critical/serious) checks; manual focus order and screen reader audit remain outstanding.
- [ ] Wallet-signed transaction + on-chain read/forgery/controlled outage remains on hold until user can authorize a dedicated test wallet.
- [ ] Human usability validation before declaring the UX objectively seamless.

**Do not claim visual or accessibility perfection from build success alone.**
